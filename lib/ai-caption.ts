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
    "Judge the MAIN SUBJECT first: what the child is holding or doing. Ignore file names and do not treat background text, watermarks, t-shirt prints, or pool signs as the event.",
    "Medal, trophy, certificate, ribbon, prize cup, or podium in the child's hands or around their neck = they WON an award, not a lesson or class.",
    "Swimming + medal = swimming competition prize (eventType PRIZE). Title examples: 游泳比賽得獎 / Swimming competition medal. Never 游泳課 or swimming lesson.",
    "A lesson/class is only when teaching is clearly the subject (instructor teaching, class in progress) AND there is no medal or trophy.",
    "Never copy a file name such as IMG_1234, DSCF, PXL, Screenshot, or anything ending in .jpg/.heic.",
    "Do not invent names, ages, schools, addresses, dates, or locations that are not clearly written in the picture.",
    `Write title and description in ${lang}.`,
    "Return ONLY compact JSON with keys: title, category, eventType, description, tags.",
    `category must be one of: ${CATEGORIES.join(", ")} (or empty string).`,
    `eventType must be one of: ${EVENT_TYPES.join(", ")}.`,
    "eventType: PRIZE if an award object is visible; COMPETITION if a race/meet is the scene without a prize object; PHOTO only for ordinary snapshots.",
    "title: max 40 characters, specific, no emoji dump.",
    "description: one or two short sentences of what is visible.",
    "tags: 0-4 short labels.",
  ].join(" ");
  const user =
    "Look at the image pixels and fill the JSON. If you cannot see the image, return {\"title\":\"\",\"category\":\"\",\"eventType\":\"PHOTO\",\"description\":\"\",\"tags\":[]}.";
  return { system, user };
}

const AWARD_RE =
  /獎牌|獎章|獎盃|獎座|獎狀|冠軍|亞軍|季軍|得獎|頒獎|金銀銅|medal|trophy|rosette|podium|certificate/i;
const COMPETITION_RE =
  /比賽|競賽|賽事|錦標賽|運動會|competition|tournament|meet|race/i;
const SWIM_RE = /游|泳|swim/i;
const LESSON_RE =
  /游泳課|游水課|課程|課堂|興趣班|lesson|class|training session/i;

export function refineCaption(
  caption: PhotoCaption,
  locale: Locale = "zh-HK",
): PhotoCaption {
  const blob = [caption.title, caption.description, ...caption.tags].join(" ");
  const hasAward = AWARD_RE.test(blob);
  const hasCompetition = COMPETITION_RE.test(blob);
  const hasSwim = SWIM_RE.test(blob);
  let { title, eventType, category } = caption;

  if (hasAward) {
    eventType = "PRIZE";
    if (!category) category = hasSwim ? "sports" : category || "sports";
    if (!title || LESSON_RE.test(title)) {
      title =
        locale === "en"
          ? hasSwim
            ? "Swimming competition medal"
            : "Competition medal"
          : hasSwim
            ? "游泳比賽得獎"
            : "比賽得獎";
    }
  } else if (hasCompetition && (eventType === "PHOTO" || eventType === "OTHER")) {
    eventType = "COMPETITION";
    if (hasSwim && (!title || LESSON_RE.test(title))) {
      title = locale === "en" ? "Swimming competition" : "游泳比賽";
    }
    if (hasSwim && !category) category = "sports";
  }

  return { ...caption, title, eventType, category };
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
