import { CATEGORIES, EVENT_TYPES } from "@/lib/constants";
import type { EventType } from "@prisma/client";
import type { Locale } from "@/lib/i18n";
import { titleLooksLikeFilename } from "@/lib/photo-vision";

export type PhotoCaption = {
  title: string;
  category: (typeof CATEGORIES)[number] | "";
  eventType: EventType;
  description: string;
  tags: string[];
};

const CATEGORY_SET = new Set<string>(CATEGORIES);
const TYPE_SET = new Set<string>(EVENT_TYPES);

export function buildCaptionPrompt(locale: Locale): { system: string; user: string } {
  const lang =
    locale === "en"
      ? "English"
      : "Hong Kong Cantonese (written 廣東話, not Mandarin)";
  const system = [
    "You caption family photos of children for a private parent portfolio.",
    "You receive only pixels. There is no filename, EXIF, GPS, or camera title.",
    "Describe what is actually visible in the image. Never copy a file name such as IMG_1234, DSCF, PXL, Screenshot, or anything ending in .jpg/.heic.",
    "Do not invent names, ages, schools, addresses, dates, or locations that are not clearly written in the picture.",
    `Write title and description in ${lang}.`,
    "Return ONLY compact JSON with keys: title, category, eventType, description, tags.",
    `category must be one of: ${CATEGORIES.join(", ")} (or empty string).`,
    `eventType must be one of: ${EVENT_TYPES.join(", ")}. Use PHOTO unless the image clearly shows a prize, competition or milestone.`,
    "title: max 40 characters, specific, no emoji dump.",
    "description: one or two short sentences of what is visible.",
    "tags: 0-4 short labels.",
  ].join(" ");
  const user =
    "Look at the image pixels and fill the JSON. If you cannot see the image, return {\"title\":\"\",\"category\":\"\",\"eventType\":\"PHOTO\",\"description\":\"\",\"tags\":[]}.";
  return { system, user };
}

export function parseCaptionJson(raw: string): PhotoCaption {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/\{[\s\S]*\}/);
  const jsonText = fenced ? fenced[0] : trimmed;
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(jsonText) as Record<string, unknown>;
  } catch {
    parsed = {};
  }

  const categoryRaw = String(parsed.category ?? "").trim().toLowerCase();
  const typeRaw = String(parsed.eventType ?? "PHOTO").trim().toUpperCase();
  const tagsRaw = parsed.tags;
  const tags = Array.isArray(tagsRaw)
    ? tagsRaw.map((t) => String(t).trim()).filter(Boolean).slice(0, 4)
    : [];

  const titleRaw = String(parsed.title ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 80);
  const title = titleLooksLikeFilename(titleRaw) ? "" : titleRaw;

  return {
    title,
    category: CATEGORY_SET.has(categoryRaw)
      ? (categoryRaw as PhotoCaption["category"])
      : "",
    eventType: TYPE_SET.has(typeRaw) ? (typeRaw as EventType) : "PHOTO",
    description: String(parsed.description ?? "").trim().slice(0, 500),
    tags,
  };
}
