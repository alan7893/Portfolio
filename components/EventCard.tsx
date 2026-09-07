import Link from "next/link";
import type { EventType, EventStatus } from "@prisma/client";
import type { Dictionary, Locale } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import { TypeBadge, StatusBadge } from "./TypeBadge";

export type EventCardData = {
  id: string;
  title: string;
  description: string | null;
  eventType: EventType;
  status: EventStatus;
  eventDate: Date;
  category: string | null;
  achievementRank: string | null;
  firstImageMediaId: string | null;
  mediaCount: number;
};

export function EventCard({
  event,
  locale,
  t,
}: {
  event: EventCardData;
  locale: Locale;
  t: Dictionary;
}) {
  const categoryLabel = event.category
    ? (t.categories as Record<string, string>)[event.category] ?? event.category
    : null;

  return (
    <Link
      href={`/events/${event.id}`}
      className="card group flex flex-col overflow-hidden transition hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-brand-100 to-rose-100">
        {event.firstImageMediaId ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/media/${event.firstImageMediaId}`}
            alt={event.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-4xl opacity-40">
            {iconForType(event.eventType)}
          </div>
        )}
        <div className="absolute left-2 top-2 flex gap-1.5">
          <TypeBadge type={event.eventType} label={t.eventTypes[event.eventType]} />
        </div>
        {event.mediaCount > 1 && (
          <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] text-white">
            {event.mediaCount} ✦
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-ink-700/60">
            {formatDate(event.eventDate, locale, t)}
          </span>
          <StatusBadge status={event.status} label={t.statuses[event.status]} />
        </div>
        <h3 className="font-semibold leading-snug text-ink-900">
          {event.title}
        </h3>
        {event.achievementRank && (
          <p className="text-sm font-medium text-amber-700">
            🏅 {event.achievementRank}
          </p>
        )}
        {event.description && (
          <p className="line-clamp-2 text-sm text-ink-700/70">
            {event.description}
          </p>
        )}
        {categoryLabel && (
          <span className="mt-auto w-fit rounded-full bg-black/5 px-2 py-0.5 text-xs text-ink-700">
            {categoryLabel}
          </span>
        )}
      </div>
    </Link>
  );
}

function iconForType(type: EventType): string {
  const icons: Record<EventType, string> = {
    PHOTO: "🖼️",
    PRIZE: "🏆",
    COMPETITION: "🥇",
    SCHEDULE: "🗓️",
    MILESTONE: "🌟",
    OTHER: "✦",
  };
  return icons[type];
}
