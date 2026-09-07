import type { EventType, EventStatus } from "@prisma/client";

const TYPE_STYLES: Record<EventType, string> = {
  PHOTO: "bg-sky-100 text-sky-700",
  PRIZE: "bg-amber-100 text-amber-700",
  COMPETITION: "bg-violet-100 text-violet-700",
  SCHEDULE: "bg-emerald-100 text-emerald-700",
  MILESTONE: "bg-rose-100 text-rose-700",
  OTHER: "bg-stone-200 text-stone-700",
};

export function TypeBadge({
  type,
  label,
}: {
  type: EventType;
  label: string;
}) {
  return <span className={`badge ${TYPE_STYLES[type]}`}>{label}</span>;
}

export function StatusBadge({
  status,
  label,
}: {
  status: EventStatus;
  label: string;
}) {
  const style =
    status === "PLANNED"
      ? "bg-blue-100 text-blue-700"
      : "bg-green-100 text-green-700";
  return <span className={`badge ${style}`}>{label}</span>;
}
