import type { Dictionary, Locale } from "@/lib/i18n";
import { datePartsUtc } from "@/lib/dates";

const EN_SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export function formatDate(
  value: Date | string,
  locale: Locale,
  _t: Dictionary,
): string {
  const parts = datePartsUtc(value);
  if (!parts) return "";
  if (locale === "zh-HK") {
    return `${parts.year}年${parts.month}月${parts.day}日`;
  }
  return `${parts.day} ${EN_SHORT_MONTHS[parts.month - 1]} ${parts.year}`;
}

export function monthLabel(month: number, locale: Locale, _t: Dictionary): string {
  if (locale === "zh-HK") return `${month + 1}月`;
  return EN_SHORT_MONTHS[month] ?? String(month + 1);
}

export function yearMonthKey(value: Date | string): string {
  const parts = datePartsUtc(value);
  if (!parts) return "";
  return `${parts.year}-${String(parts.month).padStart(2, "0")}`;
}
