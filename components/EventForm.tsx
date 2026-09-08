"use client";

import { useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import type { EventType, EventStatus } from "@prisma/client";
import type { Dictionary } from "@/lib/i18n";
import type { ActionState } from "@/lib/action-state";
import { EVENT_TYPES, EVENT_STATUSES, CATEGORIES } from "@/lib/constants";
import { PHOTO_PURPOSES, PARTICIPATION_ROLES } from "@/lib/hk-portfolio";
import { FileUploader } from "./FileUploader";
import { CaptureChecklist } from "./CaptureChecklist";

type ChildOption = { value: string; label: string };

export type EventFormDefaults = {
  childId?: string;
  eventType?: EventType;
  title?: string;
  description?: string;
  eventDate?: string; // yyyy-mm-dd
  category?: string;
  location?: string;
  achievementRank?: string;
  organiser?: string;
  officialName?: string;
  role?: string;
  childReflection?: string;
  nameOnEvidence?: boolean;
  photoPurpose?: string;
  existingMediaCount?: number;
  status?: EventStatus;
  tags?: string;
};

function SubmitButton({
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

export function EventForm({
  action,
  childOptions,
  defaults,
  t,
  cancelHref,
  captionEnabled = true,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  childOptions: ChildOption[];
  defaults?: EventFormDefaults;
  t: Dictionary;
  cancelHref: string;
  captionEnabled?: boolean;
}) {
  const [state, formAction] = useFormState(action, { error: null });
  const [eventType, setEventType] = useState<EventType>(
    defaults?.eventType ?? "PHOTO",
  );
  const [title, setTitle] = useState(defaults?.title ?? "");
  const [category, setCategory] = useState(defaults?.category ?? "");
  const [description, setDescription] = useState(defaults?.description ?? "");
  const [tags, setTags] = useState(defaults?.tags ?? "");
  const [organiser, setOrganiser] = useState(defaults?.organiser ?? "");
  const [officialName, setOfficialName] = useState(defaults?.officialName ?? "");
  const [role, setRole] = useState(defaults?.role ?? "");
  const [childReflection, setChildReflection] = useState(
    defaults?.childReflection ?? "",
  );
  const [nameOnEvidence, setNameOnEvidence] = useState(
    Boolean(defaults?.nameOnEvidence),
  );
  const [photoPurpose, setPhotoPurpose] = useState(defaults?.photoPurpose ?? "");
  const [rank, setRank] = useState(defaults?.achievementRank ?? "");
  const [stagedIds, setStagedIds] = useState<string[]>([]);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "done" | "error"
  >("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [captionStatus, setCaptionStatus] = useState<
    "idle" | "loading" | "done" | "error"
  >("idle");
  const [sendToAi, setSendToAi] = useState(captionEnabled);
  const userEditedTitle = useRef(Boolean(defaults?.title));

  const showRank =
    eventType === "PRIZE" ||
    eventType === "COMPETITION" ||
    photoPurpose === "medal" ||
    photoPurpose === "certificate";

  async function onFiles(files: File[]) {
    const image = files.find(
      (f) =>
        f.type.startsWith("image/") ||
        /\.(jpe?g|png|webp|heic|heif)$/i.test(f.name),
    );
    if (!files.length) {
      setStagedIds([]);
      setUploadStatus("idle");
      setUploadError(null);
      setCaptionStatus("idle");
      return;
    }

    setUploadStatus("uploading");
    setUploadError(null);
    const nextIds: string[] = [];
    try {
      for (const file of files) {
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/media/stage", { method: "POST", body });
        const json = (await res.json().catch(() => ({}))) as {
          id?: string;
          error?: string;
        };
        if (!res.ok || !json.id) {
          throw new Error(json.error || "Upload failed");
        }
        nextIds.push(json.id);
      }
      setStagedIds(nextIds);
      setUploadStatus("done");
    } catch (e) {
      setStagedIds([]);
      setUploadStatus("error");
      setUploadError(e instanceof Error ? e.message : t.upload.uploadFailed);
      setCaptionStatus("idle");
      return;
    }

    if (!image) {
      setCaptionStatus("idle");
      return;
    }
    if (!captionEnabled || !sendToAi) {
      setCaptionStatus("idle");
      return;
    }
    setCaptionStatus("loading");
    try {
      const body = new FormData();
      body.append("staged", nextIds[0]);
      body.append("locale", t.locale);
      const res = await fetch("/api/ai/caption", { method: "POST", body });
      const json = (await res.json().catch(() => ({}))) as {
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
        error?: string;
      };
      if (!res.ok) {
        setCaptionStatus("error");
        return;
      }
      if (!userEditedTitle.current && json.title) setTitle(json.title);
      if (json.category) setCategory(json.category);
      if (json.description && !description) setDescription(json.description);
      if (json.eventType) setEventType(json.eventType);
      if (json.tags?.length && !tags) setTags(json.tags.join(", "));
      if (json.organiser && !organiser) setOrganiser(json.organiser);
      if (json.officialName && !officialName) setOfficialName(json.officialName);
      if (json.achievementRank && !rank) setRank(json.achievementRank);
      if (json.role && !role) setRole(json.role);
      if (json.photoPurpose && !photoPurpose) setPhotoPurpose(json.photoPurpose);
      if (json.nameOnEvidence) setNameOnEvidence(true);
      if (json.childReflection && !childReflection) {
        setChildReflection(json.childReflection);
      }
      setCaptionStatus("done");
    } catch {
      setCaptionStatus("error");
    }
  }

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">{t.events.child}</label>
          <select
            name="childId"
            className="input"
            defaultValue={defaults?.childId ?? childOptions[0]?.value ?? ""}
            required
          >
            {childOptions.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">{t.events.type}</label>
          <select
            name="eventType"
            className="input"
            value={eventType}
            onChange={(e) => setEventType(e.target.value as EventType)}
          >
            {EVENT_TYPES.map((tp) => (
              <option key={tp} value={tp}>
                {t.eventTypes[tp]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">
          {t.events.titleField}{" "}
          {stagedIds.length > 0 && (
            <span className="text-xs font-normal text-ink-700/50">
              ({t.common.optional})
            </span>
          )}
        </label>
        <input
          name="title"
          className="input"
          value={title}
          onChange={(e) => {
            userEditedTitle.current = true;
            setTitle(e.target.value);
          }}
          maxLength={200}
          required={stagedIds.length === 0}
          placeholder={t.events.titleFromPhoto}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="label">{t.events.date}</label>
          <input
            type="date"
            name="eventDate"
            className="input"
            defaultValue={defaults?.eventDate ?? today()}
            required
          />
        </div>
        <div>
          <label className="label">{t.events.category}</label>
          <select
            name="category"
            className="input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">—</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {(t.categories as Record<string, string>)[c]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">{t.events.status}</label>
          <select
            name="status"
            className="input"
            defaultValue={defaults?.status ?? "COMPLETED"}
          >
            {EVENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {t.statuses[s as EventStatus]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">{t.events.photoPurpose}</label>
          <select
            name="photoPurpose"
            className="input"
            value={photoPurpose}
            onChange={(e) => setPhotoPurpose(e.target.value)}
          >
            <option value="">—</option>
            {PHOTO_PURPOSES.map((p) => (
              <option key={p} value={p}>
                {t.photoPurposes[p]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">
            {t.events.officialName}{" "}
            <span className="text-xs text-ink-700/50">({t.common.optional})</span>
          </label>
          <input
            name="officialName"
            className="input"
            value={officialName}
            onChange={(e) => setOfficialName(e.target.value)}
            placeholder={t.events.officialNamePlaceholder}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">
            {t.events.organiser}{" "}
            <span className="text-xs text-ink-700/50">({t.common.optional})</span>
          </label>
          <input
            name="organiser"
            className="input"
            value={organiser}
            onChange={(e) => setOrganiser(e.target.value)}
            placeholder={t.events.organiserPlaceholder}
          />
        </div>
        <div>
          <label className="label">
            {t.events.role}{" "}
            <span className="text-xs text-ink-700/50">({t.common.optional})</span>
          </label>
          <select
            name="role"
            className="input"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="">—</option>
            {PARTICIPATION_ROLES.map((r) => (
              <option key={r} value={r}>
                {t.roles[r]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">
            {t.events.location}{" "}
            <span className="text-xs text-ink-700/50">({t.common.optional})</span>
          </label>
          <input
            name="location"
            className="input"
            defaultValue={defaults?.location ?? ""}
          />
        </div>
        {showRank && (
          <div>
            <label className="label">{t.events.rank}</label>
            <input
              name="achievementRank"
              className="input"
              placeholder={t.events.rankPlaceholder}
              value={rank}
              onChange={(e) => setRank(e.target.value)}
            />
          </div>
        )}
        {!showRank && <input type="hidden" name="achievementRank" value={rank} />}
      </div>

      <label className="flex items-start gap-2 text-sm text-ink-800">
        <input
          type="checkbox"
          name="nameOnEvidence"
          value="true"
          className="mt-1"
          checked={nameOnEvidence}
          onChange={(e) => setNameOnEvidence(e.target.checked)}
        />
        <span>
          {t.events.nameOnEvidence}
          <span className="mt-0.5 block text-xs text-ink-700/60">
            {t.events.nameOnEvidenceHint}
          </span>
        </span>
      </label>

      <div>
        <label className="label">
          {t.events.childReflection}{" "}
          <span className="text-xs text-ink-700/50">({t.common.optional})</span>
        </label>
        <textarea
          name="childReflection"
          className="input min-h-[72px]"
          value={childReflection}
          onChange={(e) => setChildReflection(e.target.value)}
          maxLength={1000}
        />
        <p className="mt-1 text-xs text-ink-700/50">{t.events.childReflectionHint}</p>
      </div>

      <div>
        <label className="label">
          {t.events.description}{" "}
          <span className="text-xs text-ink-700/50">({t.common.optional})</span>
        </label>
        <textarea
          name="description"
          className="input min-h-[96px]"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={5000}
        />
      </div>

      <div>
        <label className="label">{t.events.tags}</label>
        <input
          name="tags"
          className="input"
          placeholder={t.events.tagsHint}
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
        <p className="mt-1 text-xs text-ink-700/50">{t.events.tagsHint}</p>
      </div>

      <CaptureChecklist
        t={t}
        values={{
          eventType,
          photoPurpose,
          officialName,
          organiser,
          role,
          achievementRank: rank,
          nameOnEvidence,
          childReflection,
          category,
          hasMedia: stagedIds.length > 0 || (defaults?.existingMediaCount ?? 0) > 0,
          description,
        }}
      />

      <div>
        <label className="label">{t.events.media}</label>
        {captionEnabled ? (
          <label className="mb-2 flex items-start gap-2 text-sm text-ink-800">
            <input
              type="checkbox"
              className="mt-1"
              checked={sendToAi}
              onChange={(e) => setSendToAi(e.target.checked)}
            />
            <span>
              {t.events.sendPhotoToAi}
              <a href="/settings" className="ml-2 text-xs text-brand-700 hover:underline">
                {t.events.privacyLink}
              </a>
            </span>
          </label>
        ) : (
          <p className="mb-2 text-sm text-ink-700/70">
            {t.events.sendPhotoToAiOff}{" "}
            <a href="/settings" className="text-brand-700 hover:underline">
              {t.events.privacyLink}
            </a>
          </p>
        )}
        <FileUploader
          onFiles={onFiles}
          labels={{
            dropHint: t.upload.dropHint,
            accept: t.upload.accept,
            selected: t.upload.selected,
            tooLarge: t.upload.tooLarge,
            badType: t.upload.badType,
            remove: t.upload.remove,
          }}
        />
        {stagedIds.map((id) => (
          <input key={id} type="hidden" name="staged" value={id} />
        ))}
        {captionStatus === "loading" && (
          <p className="mt-2 text-sm text-brand-700">{t.events.captioning}</p>
        )}
        {captionStatus === "done" && (
          <p className="mt-2 text-sm text-emerald-700">{t.events.captioned}</p>
        )}
        {captionStatus === "error" && (
          <p className="mt-2 text-sm text-amber-800">{t.events.captionFailed}</p>
        )}
        {(captionStatus === "loading" || captionStatus === "done") && (
          <p className="mt-1 text-xs text-ink-700/50">{t.events.captionPrivacy}</p>
        )}
        {uploadStatus === "uploading" && (
          <p className="mt-2 text-sm text-brand-700">{t.upload.uploading}</p>
        )}
        {uploadStatus === "done" && (
          <p className="mt-2 text-sm text-emerald-700">{t.upload.uploaded}</p>
        )}
        {uploadStatus === "error" && (
          <p className="mt-2 text-sm text-red-600">
            {t.upload.uploadFailed}
            {uploadError ? ` ${uploadError}` : ""}
          </p>
        )}
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {t.events.formError} {state.error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <SubmitButton
          label={t.common.save}
          pendingLabel={t.common.loading}
          disabled={uploadStatus === "uploading"}
        />
        <a href={cancelHref} className="btn-ghost">
          {t.common.cancel}
        </a>
      </div>
    </form>
  );
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}
