/** Calendar date as YYYY-MM-DD. Stored and compared as UTC midnight. */

const YMD_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function todayDateOnly(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateOnly(value: string | Date): Date | null {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return new Date(
      Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
    );
  }
  const match = YMD_RE.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (
    dt.getUTCFullYear() !== year ||
    dt.getUTCMonth() !== month - 1 ||
    dt.getUTCDate() !== day
  ) {
    return null;
  }
  return dt;
}

export function datePartsUtc(value: string | Date): {
  year: number;
  month: number;
  day: number;
} | null {
  const dt =
    value instanceof Date
      ? Number.isNaN(value.getTime())
        ? null
        : value
      : parseDateOnly(value);
  if (!dt) return null;
  return {
    year: dt.getUTCFullYear(),
    month: dt.getUTCMonth() + 1,
    day: dt.getUTCDate(),
  };
}

export function formatYmd(value: string | Date): string | null {
  const parts = datePartsUtc(value);
  if (!parts) return null;
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}
