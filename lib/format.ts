import type { Dictionary, Locale } from "@/lib/i18n";

export function formatDate(
  value: Date | string,
  locale: Locale,
  t: Dictionary,
): string {
  const d = typeof value === "string" ? new Date(value) : value;
  const y = d.getFullYear();
  const m = d.getMonth();
  const day = d.getDate();
  if (locale === "zh-HK") {
    return `${y}年${t.months[m]}${day}日`;
  }
  return `${t.months[m]} ${day}, ${y}`;
}

export function monthLabel(month: number, locale: Locale, t: Dictionary): string {
  if (locale === "zh-HK") return t.months[month];
  return t.months[month];
}

export function yearMonthKey(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
