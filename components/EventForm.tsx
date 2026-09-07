"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import type { EventType, EventStatus } from "@prisma/client";
import type { Dictionary } from "@/lib/i18n";
import { EVENT_TYPES, EVENT_STATUSES, CATEGORIES } from "@/lib/constants";
import { FileUploader } from "./FileUploader";

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
  status?: EventStatus;
  tags?: string;
};

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
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
}: {
  action: (formData: FormData) => void | Promise<void>;
  childOptions: ChildOption[];
  defaults?: EventFormDefaults;
  t: Dictionary;
  cancelHref: string;
}) {
  const [eventType, setEventType] = useState<EventType>(
    defaults?.eventType ?? "PHOTO",
  );

  const showRank = eventType === "PRIZE" || eventType === "COMPETITION";

  return (
    <form action={action} className="space-y-5">
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
        <label className="label">{t.events.titleField}</label>
        <input
          name="title"
          className="input"
          defaultValue={defaults?.title ?? ""}
          maxLength={200}
          required
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
            defaultValue={defaults?.category ?? ""}
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
              defaultValue={defaults?.achievementRank ?? ""}
            />
          </div>
        )}
        {!showRank && <input type="hidden" name="achievementRank" value="" />}
      </div>

      <div>
        <label className="label">
          {t.events.description}{" "}
          <span className="text-xs text-ink-700/50">({t.common.optional})</span>
        </label>
        <textarea
          name="description"
          className="input min-h-[96px]"
          defaultValue={defaults?.description ?? ""}
          maxLength={5000}
        />
      </div>

      <div>
        <label className="label">{t.events.tags}</label>
        <input
          name="tags"
          className="input"
          placeholder={t.events.tagsHint}
          defaultValue={defaults?.tags ?? ""}
        />
        <p className="mt-1 text-xs text-ink-700/50">{t.events.tagsHint}</p>
      </div>

      <div>
        <label className="label">{t.events.media}</label>
        <FileUploader
          labels={{
            dropHint: t.upload.dropHint,
            accept: t.upload.accept,
            selected: t.upload.selected,
            tooLarge: t.upload.tooLarge,
            badType: t.upload.badType,
            remove: t.upload.remove,
          }}
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <SubmitButton label={t.common.save} pendingLabel={t.common.loading} />
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
