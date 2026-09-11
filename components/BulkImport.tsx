"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { flushSync } from "react-dom";
import Link from "next/link";
import type { EventType } from "@prisma/client";
import type { Dictionary, Locale } from "@/lib/i18n";
import { interpolate } from "@/lib/i18n";
import type { ActionState } from "@/lib/action-state";
import { ACCEPTED_MIME, BULK_MAX_PHOTOS, MAX_FILE_BYTES, mimeFromName } from "@/lib/constants";
import { EVENT_TYPES, CATEGORIES } from "@/lib/constants";
import { todayDateOnly } from "@/lib/dates";
import { formatDate } from "@/lib/format";
import {
  dateFromCameraOrToday,
  isSavableItem,
  isUploadBusy,
  keepCameraDate,
} from "@/lib/bulk-flow";

type ChildOption = { value: string; label: string };

type CaptionJson = {
  title?: string;
  category?: string;
  eventType?: EventType;
  description?: string;
  tags?: string[];
  organiser?: string;
  officialName?: string;
  achievementRank?: string;
  role?: string;
  photoPurpose?: string;
  nameOnEvidence?: boolean;
  childReflection?: string;
  suggestedDate?: string | null;
  error?: string;
};

type ItemStatus = "queued" | "uploading" | "uploaded" | "captioning" | "ready" | "error";

type BulkItem = {
  localId: string;
  name: string;
  previewUrl: string;
  stagedId: string;
  suggestedDate: string;
  dateFromPhoto: boolean;
  title: string;
  description: string;
  eventType: EventType;
  category: string;
  tags: string;
  organiser: string;
  officialName: string;
  achievementRank: string;
  role: string;
  photoPurpose: string;
  nameOnEvidence: boolean;
  childReflection: string;
  status: ItemStatus;
  skipped: boolean;
  error: string | null;
};

function isImageName(name: string, type: string): boolean {
  const mime = type || mimeFromName(name);
  return mime.startsWith("image/");
}

function SaveButton({
  label,
  pendingLabel,
  disabled,
}: {
  label: string;
  pendingLabel: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending || disabled}>
      {pending ? pendingLabel : label}
    </button>
  );
}

export function BulkImport({
  action,
  childOptions,
  defaultChildId,
  captionEnabled,
  t,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  childOptions: ChildOption[];
  defaultChildId: string;
  captionEnabled: boolean;
  t: Dictionary;
}) {
  const [state, formAction] = useFormState(action, { error: null });
  const [childId, setChildId] = useState(defaultChildId);
  const [sendToAi, setSendToAi] = useState(captionEnabled);
  const [items, setItems] = useState<BulkItem[]>([]);
  const [tooMany, setTooMany] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const sendToAiRef = useRef(sendToAi);
  sendToAiRef.current = sendToAi;
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const untitled = t.events.bulkUntitled;

  useEffect(() => {
    return () => {
      for (const item of items) {
        if (item.previewUrl.startsWith("blob:")) URL.revokeObjectURL(item.previewUrl);
      }
    };
    // Revoke on unmount only; items is the latest via closure at unmount time
    // if we listed items, we'd revoke while still showing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function patch(localId: string, next: Partial<BulkItem>) {
    setItems((prev) => prev.map((it) => (it.localId === localId ? { ...it, ...next } : it)));
  }

  async function uploadOne(localId: string, file: File): Promise<string | null> {
    patch(localId, { status: "uploading", error: null });
    const body = new FormData();
    body.append("file", file);
    const stageRes = await fetch("/api/media/stage", { method: "POST", body });
    const staged = (await stageRes.json().catch(() => ({}))) as {
      id?: string;
      suggestedDate?: string | null;
      error?: string;
    };
    if (!stageRes.ok || !staged.id) {
      patch(localId, {
        status: "error",
        error: staged.error || t.upload.uploadFailed,
      });
      return null;
    }
    const dated = dateFromCameraOrToday(staged.suggestedDate, todayDateOnly());
    patch(localId, {
      stagedId: staged.id,
      suggestedDate: dated.suggestedDate,
      dateFromPhoto: dated.dateFromPhoto,
      status: "uploaded",
      title: untitled,
      error: null,
    });
    return staged.id;
  }

  async function captionOne(localId: string, file: File, stagedId: string) {
    const snapshot = itemsRef.current.find((it) => it.localId === localId);
    if (!snapshot || snapshot.skipped || snapshot.status === "error") {
      return;
    }
    const useAi = captionEnabled && sendToAiRef.current && isImageName(file.name, file.type);
    if (!useAi) {
      patch(localId, { status: "ready" });
      return;
    }

    patch(localId, { status: "captioning" });
    const capBody = new FormData();
    capBody.append("staged", stagedId);
    capBody.append("locale", t.locale);
    const capRes = await fetch("/api/ai/caption", { method: "POST", body: capBody });
    const json = (await capRes.json().catch(() => ({}))) as CaptionJson;
    const latest = itemsRef.current.find((it) => it.localId === localId);
    const dated = keepCameraDate(
      {
        suggestedDate: latest?.suggestedDate ?? snapshot.suggestedDate,
        dateFromPhoto: latest?.dateFromPhoto ?? snapshot.dateFromPhoto,
      },
      json.suggestedDate,
    );
    if (!capRes.ok) {
      patch(localId, {
        status: "error",
        title: latest?.title || untitled,
        ...dated,
        error: json.error || t.events.bulkFailed,
      });
      return;
    }
    patch(localId, {
      status: "ready",
      title: json.title?.trim() || untitled,
      description: json.description ?? "",
      eventType: json.eventType || "PHOTO",
      category: json.category ?? "",
      tags: json.tags?.length ? json.tags.join(", ") : "",
      organiser: json.organiser ?? "",
      officialName: json.officialName ?? "",
      achievementRank: json.achievementRank ?? "",
      role: json.role ?? "",
      photoPurpose: json.photoPurpose ?? "",
      nameOnEvidence: Boolean(json.nameOnEvidence),
      childReflection: json.childReflection ?? "",
      ...dated,
      error: null,
    });
  }

  async function addFiles(fileList: File[]) {
    const accepted: File[] = [];
    for (const file of fileList) {
      const type = file.type || mimeFromName(file.name);
      if (!ACCEPTED_MIME.includes(type as (typeof ACCEPTED_MIME)[number])) continue;
      if (file.size > MAX_FILE_BYTES) continue;
      accepted.push(file);
    }
    const skippedOut = items.filter((p) => !p.skipped).length;
    const room = Math.max(0, BULK_MAX_PHOTOS - skippedOut);
    setTooMany(accepted.length > room);
    const take = accepted.slice(0, room);
    const added: BulkItem[] = take.map((file) => ({
      localId: crypto.randomUUID(),
      name: file.name,
      previewUrl: URL.createObjectURL(file),
      stagedId: "",
      suggestedDate: todayDateOnly(),
      dateFromPhoto: false,
      title: "",
      description: "",
      eventType: "PHOTO",
      category: "",
      tags: "",
      organiser: "",
      officialName: "",
      achievementRank: "",
      role: "",
      photoPurpose: "",
      nameOnEvidence: false,
      childReflection: "",
      status: "queued",
      skipped: false,
      error: null,
    }));
    flushSync(() => {
      setItems((prev) => [...prev, ...added]);
    });
    if (added.length) void runBatch(added, take);
  }

  async function runPool<T>(jobs: T[], workers: number, fn: (job: T) => Promise<void>) {
    let cursor = 0;
    async function worker() {
      while (cursor < jobs.length) {
        const index = cursor;
        cursor += 1;
        await fn(jobs[index]);
      }
    }
    await Promise.all(Array.from({ length: Math.min(workers, jobs.length) }, () => worker()));
  }

  async function runBatch(added: BulkItem[], files: File[]) {
    const jobs = added.map((item, index) => ({ item, file: files[index], stagedId: "" }));
    await runPool(jobs, 3, async (job) => {
      try {
        job.stagedId = (await uploadOne(job.item.localId, job.file)) ?? "";
      } catch {
        patch(job.item.localId, {
          status: "error",
          error: t.upload.uploadFailed,
          title: untitled,
        });
      }
    });
    await runPool(jobs, 2, async (job) => {
      if (!job.stagedId) return;
      try {
        await captionOne(job.item.localId, job.file, job.stagedId);
      } catch {
        patch(job.item.localId, { status: "error", error: t.events.bulkFailed, title: untitled });
      }
    });
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    if (e.dataTransfer.files?.length) {
      void addFiles(Array.from(e.dataTransfer.files));
    }
  }

  const active = items.filter((it) => !it.skipped);
  const uploadedCount = active.filter((it) => it.stagedId).length;
  const captionDone = active.filter((it) => it.status === "ready" || it.status === "error").length;
  const uploading = active.some((it) => isUploadBusy(it.status));
  const captioning = active.some((it) => it.status === "captioning" || it.status === "uploaded");
  const savable = active.filter(isSavableItem);
  const payload = useMemo(
    () =>
      JSON.stringify({
        items: savable.map((it) => ({
          staged: it.stagedId,
          title: it.title.trim() || untitled,
          description: it.description,
          eventDate: it.suggestedDate,
          eventType: it.eventType,
          category: it.category,
          achievementRank: it.achievementRank,
          organiser: it.organiser,
          officialName: it.officialName,
          role: it.role,
          childReflection: it.childReflection,
          nameOnEvidence: it.nameOnEvidence,
          photoPurpose: it.photoPurpose,
          tags: it.tags,
        })),
      }),
    [savable, untitled],
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">{t.events.child}</label>
          <select
            className="input"
            value={childId}
            onChange={(e) => setChildId(e.target.value)}
          >
            {childOptions.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          {captionEnabled ? (
            <label className="flex items-start gap-2 text-sm text-ink-800">
              <input
                type="checkbox"
                className="mt-1"
                checked={sendToAi}
                onChange={(e) => setSendToAi(e.target.checked)}
              />
              <span>
                {t.events.bulkUseAi}{" "}
                <Link href="/settings" className="text-xs text-brand-700 hover:underline">
                  {t.events.privacyLink}
                </Link>
              </span>
            </label>
          ) : (
            <p className="text-sm text-ink-700/70">
              {t.events.sendPhotoToAiOff}{" "}
              <Link href="/settings" className="text-brand-700 hover:underline">
                {t.events.privacyLink}
              </Link>
            </p>
          )}
        </div>
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="relative grid place-items-center gap-1 overflow-hidden rounded-xl border-2 border-dashed border-black/15 bg-white/60 px-4 py-10 text-center hover:border-brand-400"
      >
        <span className="pointer-events-none text-2xl">📷</span>
        <span className="pointer-events-none text-sm font-medium text-ink-800">
          {t.events.bulkDrop}
        </span>
        <span className="pointer-events-none text-xs text-ink-700/60">
          {interpolate(t.events.bulkAccept, { max: BULK_MAX_PHOTOS })}
        </span>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif,.jpg,.jpeg,.png,.webp"
          className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
          onChange={(e) => {
            const list = e.target.files ? Array.from(e.target.files) : [];
            if (list.length) void addFiles(list);
            e.target.value = "";
          }}
        />
      </div>
      {tooMany && (
        <p className="text-sm text-amber-800">
          {interpolate(t.events.bulkTooMany, { max: BULK_MAX_PHOTOS })}
        </p>
      )}

      {active.length > 0 && (
        <p className="text-sm text-ink-700/80">
          {uploading
            ? interpolate(t.events.bulkProgress, { done: uploadedCount, total: active.length })
            : captioning
              ? interpolate(t.events.bulkProgressCaption, {
                  done: captionDone,
                  total: active.length,
                })
              : interpolate(t.events.bulkReady, { count: savable.length })}
        </p>
      )}

      <ul className="space-y-3">
        {items.map((it) => {
          if (it.skipped) return null;
          const statusLabel =
            it.status === "uploading"
              ? t.events.bulkUploading
              : it.status === "queued"
                ? t.events.bulkWaiting
                : it.status === "captioning"
                  ? t.events.bulkCaptioning
                  : it.status === "uploaded"
                    ? t.events.bulkUploaded
                    : it.status === "error"
                      ? t.events.bulkFailed
                      : it.dateFromPhoto
                        ? t.events.bulkDateFromPhoto
                        : t.events.bulkDateToday;
          return (
            <li key={it.localId} className="card flex gap-3 p-3 sm:p-4">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-black/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.previewUrl} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <input
                    className="input"
                    value={it.title}
                    onChange={(e) => patch(it.localId, { title: e.target.value })}
                    placeholder={untitled}
                    maxLength={200}
                  />
                  <div>
                    <input
                      type="date"
                      lang="en"
                      className="input"
                      value={it.suggestedDate}
                      onChange={(e) =>
                        patch(it.localId, {
                          suggestedDate: e.target.value,
                          dateFromPhoto: false,
                        })
                      }
                    />
                    <p className="mt-1 text-xs text-ink-700/60">
                      {formatDate(it.suggestedDate, t.locale as Locale, t)}
                      {it.dateFromPhoto ? ` · ${t.events.bulkDateFromPhoto}` : ""}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <select
                    className="input"
                    value={it.eventType}
                    onChange={(e) => patch(it.localId, { eventType: e.target.value as EventType })}
                  >
                    {EVENT_TYPES.map((tp) => (
                      <option key={tp} value={tp}>
                        {t.eventTypes[tp]}
                      </option>
                    ))}
                  </select>
                  <select
                    className="input"
                    value={it.category}
                    onChange={(e) => patch(it.localId, { category: e.target.value })}
                  >
                    <option value="">—</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {(t.categories as Record<string, string>)[c]}
                      </option>
                    ))}
                  </select>
                </div>
                <textarea
                  className="input min-h-[64px]"
                  value={it.description}
                  onChange={(e) => patch(it.localId, { description: e.target.value })}
                  maxLength={5000}
                  placeholder={t.events.description}
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-ink-700/60">{statusLabel}</p>
                  <button
                    type="button"
                    className="text-xs text-ink-700/70 underline"
                    onClick={() => patch(it.localId, { skipped: true })}
                  >
                    {t.events.bulkSkip}
                  </button>
                </div>
                {it.error && <p className="text-xs text-amber-800">{it.error}</p>}
              </div>
            </li>
          );
        })}
      </ul>

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="childId" value={childId} />
        <input type="hidden" name="payload" value={payload} />
        {state.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <SaveButton
            label={interpolate(t.events.bulkSave, { count: savable.length })}
            pendingLabel={t.common.loading}
            disabled={uploading || savable.length === 0}
          />
          <Link href="/events" className="btn-ghost">
            {t.common.cancel}
          </Link>
        </div>
      </form>
    </div>
  );
}
