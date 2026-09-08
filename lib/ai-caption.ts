import { CATEGORIES, EVENT_TYPES } from "@/lib/constants";
import {
  PHOTO_PURPOSES,
  PARTICIPATION_ROLES,
  type PhotoPurpose,
  type ParticipationRole,
} from "@/lib/hk-portfolio";
import type { EventType } from "@prisma/client";
import type { Locale } from "@/lib/i18n";
import { titleLooksLikeFilename } from "@/lib/photo-vision";

export type PhotoCaption = {
  title: string;
  category: (typeof CATEGORIES)[number] | "";
  eventType: EventType;
  description: string;
  tags: string[];
  organiser: string;
  officialName: string;
  achievementRank: string;
  role: ParticipationRole | "";
  photoPurpose: PhotoPurpose | "";
  nameOnEvidence: boolean;
  childReflection: string;
};

export type AwardFacts = {
  holdingMedal: boolean;
  wearingMedal: boolean;
  holdingTrophy: boolean;
  isLesson: boolean;
  sportHint: string;
  hasCertificate: boolean;
  namePrinted: boolean;
};

const CATEGORY_SET = new Set<string>(CATEGORIES);
const TYPE_SET = new Set<string>(EVENT_TYPES);
const PURPOSE_SET = new Set<string>(PHOTO_PURPOSES);
const ROLE_SET = new Set<string>(PARTICIPATION_ROLES);

function asBool(value: unknown): boolean {
  if (value === true || value === "true" || value === 1 || value === "1") return true;
  return false;
}

export function emptyAwardFacts(): AwardFacts {
  return {
    holdingMedal: false,
    wearingMedal: false,
    holdingTrophy: false,
    isLesson: false,
    sportHint: "",
    hasCertificate: false,
    namePrinted: false,
  };
}

export function hasAwardObject(facts: AwardFacts): boolean {
  return facts.holdingMedal || facts.wearingMedal || facts.holdingTrophy || facts.hasCertificate;
}

export function parseAwardDetect(raw: string): AwardFacts {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/\{[\s\S]*\}/);
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(fenced ? fenced[0] : trimmed) as Record<string, unknown>;
  } catch {
    parsed = {};
  }
  return {
    holdingMedal: asBool(parsed.holdingMedal) || asBool(parsed.hasMedal),
    wearingMedal: asBool(parsed.wearingMedal),
    holdingTrophy: asBool(parsed.holdingTrophy) || asBool(parsed.hasTrophy),
    isLesson: asBool(parsed.isLesson),
    sportHint: String(parsed.sportHint ?? "").trim().slice(0, 40),
    hasCertificate: asBool(parsed.hasCertificate) || asBool(parsed.hasAwardDocument),
    namePrinted: asBool(parsed.namePrinted) || asBool(parsed.childNameVisible),
  };
}

export function buildAwardDetectPrompt(): { system: string; user: string } {
  const system = [
    "You inspect family photos for prize objects and printed proof. Accuracy matters more than speed.",
    "Look at the child's hands, fingers, chest, neck, lanyard, and anything held up to the camera.",
    "A medal is a small round metal disc (gold, silver, bronze, or coloured), often on a ribbon or string. It can be tiny in the frame.",
    "If a round metallic prize is in a hand, on a palm, between fingers, or hanging on the chest, holdingMedal or wearingMedal is true.",
    "hasCertificate is true if a paper certificate, award letter, or score sheet is the subject.",
    "namePrinted is true only if a child's name is clearly readable on a medal, trophy plate, or certificate. Guessing a name is forbidden.",
    "When unsure between a coin-like medal and a toy, prefer holdingMedal=true if it looks like an award.",
    "isLesson is true only if teaching is the main subject AND there is no medal, trophy, or certificate.",
    "A pool, swim cap, or goggles without a medal is not automatically a lesson.",
    "Return ONLY JSON with keys: holdingMedal, wearingMedal, holdingTrophy, hasCertificate, namePrinted, isLesson, sportHint.",
    "sportHint: short sport name if obvious (swimming, football, athletics), else empty string.",
  ].join(" ");
  const user =
    "Detect prize objects and printed names in this photo. Return JSON only.";
  return { system, user };
}

export function buildCaptionPrompt(
  locale: Locale,
  facts: AwardFacts = emptyAwardFacts(),
): { system: string; user: string } {
  const lang =
    locale === "en"
      ? "English"
      : "Hong Kong Cantonese (written 廣東話, not Mandarin)";
  const awardLock = hasAwardObject(facts)
    ? `CONFIRMED: the child is holding or wearing a medal/trophy, or a certificate is visible. eventType MUST be PRIZE. Title MUST be a competition win (e.g. 游泳比賽得獎), never a lesson/class. isLesson is false.`
    : facts.isLesson
      ? "A class/lesson is possible only if no medal is present."
      : "If you see a medal, trophy, or certificate, eventType is PRIZE, not PHOTO and not a lesson.";
  const sportLock = facts.sportHint ? `Likely sport: ${facts.sportHint}.` : "";
  const nameLock = facts.namePrinted
    ? "A child's name is printed on the medal or certificate. Set nameOnEvidence true. Do not copy the name into the title unless it is clearly printed."
    : "nameOnEvidence is true only if a name is clearly printed on a medal plate or certificate. Otherwise false.";
  const system = [
    "You caption family photos of children for a private Hong Kong school-admission portfolio.",
    "You receive only pixels. There is no filename, EXIF, GPS, or camera title.",
    "Judge the MAIN SUBJECT first: what the child is holding or doing. Ignore file names, watermarks, t-shirt prints, and pool signs.",
    awardLock,
    sportLock,
    nameLock,
    "A small gold/silver disc in a hand is a medal even if the child is beside a pool.",
    "Never copy a file name such as IMG_1234, DSCF, PXL, Screenshot, or anything ending in .jpg/.heic.",
    "Do not invent names, ages, schools, addresses, dates, organisers, ranks, or locations that are not clearly written in the picture.",
    "If printed text on a certificate or medal is readable, copy officialName, organiser, achievementRank, and year into the matching fields. If it is not readable, leave those fields empty.",
    `Write title, description, and childReflection in ${lang}.`,
    "Return ONLY compact JSON with keys: holdingMedal, wearingMedal, holdingTrophy, hasCertificate, namePrinted, nameOnEvidence, title, category, eventType, description, tags, organiser, officialName, achievementRank, role, photoPurpose, childReflection.",
    `category must be one of: ${CATEGORIES.join(", ")} (or empty string).`,
    `eventType must be one of: ${EVENT_TYPES.join(", ")}.`,
    `photoPurpose must be one of: ${PHOTO_PURPOSES.join(", ")} (or empty string). Use medal, certificate, activity, lifestyle, work, or family.`,
    `role must be one of: ${PARTICIPATION_ROLES.join(", ")} (or empty string). Default participant for a prize photo.`,
    "eventType: PRIZE if an award object or certificate is visible; COMPETITION if a race/meet without a prize object; PHOTO only for ordinary snapshots.",
    "title: max 40 characters, specific, no emoji dump.",
    "description: one or two short sentences of what is visible, including any medal in the hands.",
    "childReflection: one short sentence of what the child appears to be doing or feeling, only from the picture. Empty if unclear.",
    "tags: 0-4 short labels.",
  ]
    .filter(Boolean)
    .join(" ");
  const user =
    "Look at the image pixels and fill the JSON. If you cannot see the image, return {\"title\":\"\",\"category\":\"\",\"eventType\":\"PHOTO\",\"description\":\"\",\"tags\":[],\"holdingMedal\":false,\"wearingMedal\":false,\"holdingTrophy\":false,\"hasCertificate\":false,\"namePrinted\":false,\"nameOnEvidence\":false,\"organiser\":\"\",\"officialName\":\"\",\"achievementRank\":\"\",\"role\":\"\",\"photoPurpose\":\"\",\"childReflection\":\"\"}.";
  return { system, user };
}

const AWARD_RE =
  /獎牌|獎章|獎盃|獎座|獎狀|金牌|銀牌|銅牌|冠軍|亞軍|季軍|得獎|頒獎|medal|trophy|rosette|podium|certificate/i;
const COMPETITION_RE =
  /比賽|競賽|賽事|錦標賽|運動會|competition|tournament|meet|race/i;
const SWIM_RE = /游|泳|swim/i;
const LESSON_RE =
  /游泳課|游水課|課程|課堂|興趣班|lesson|class|training session/i;

export function refineCaption(
  caption: PhotoCaption,
  locale: Locale = "zh-HK",
  facts: AwardFacts = emptyAwardFacts(),
): PhotoCaption {
  const blob = [caption.title, caption.description, ...caption.tags, facts.sportHint].join(" ");
  const hasAward = hasAwardObject(facts) || AWARD_RE.test(blob);
  const hasCompetition = COMPETITION_RE.test(blob);
  const hasSwim = SWIM_RE.test(blob) || /swim/i.test(facts.sportHint);
  let { title, eventType, category, photoPurpose, nameOnEvidence, role } = caption;

  if (hasAward) {
    eventType = "PRIZE";
    if (!category) category = "sports";
    if (!photoPurpose) {
      photoPurpose = facts.hasCertificate ? "certificate" : "medal";
    }
    if (!role) role = "participant";
    if (facts.namePrinted) nameOnEvidence = true;
    if (!title || LESSON_RE.test(title) || titleLooksLikeFilename(title) || !AWARD_RE.test(title)) {
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
    if (!photoPurpose) photoPurpose = "activity";
    if (hasSwim && (!title || LESSON_RE.test(title))) {
      title = locale === "en" ? "Swimming competition" : "游泳比賽";
    }
    if (hasSwim && !category) category = "sports";
  } else if (!photoPurpose && eventType === "PHOTO") {
    photoPurpose = category === "family" ? "family" : "lifestyle";
  }

  return { ...caption, title, eventType, category, photoPurpose, nameOnEvidence, role };
}

function asPurpose(value: unknown): PhotoPurpose | "" {
  const raw = String(value ?? "").trim().toLowerCase();
  return PURPOSE_SET.has(raw) ? (raw as PhotoPurpose) : "";
}

function asRole(value: unknown): ParticipationRole | "" {
  const raw = String(value ?? "").trim().toLowerCase();
  return ROLE_SET.has(raw) ? (raw as ParticipationRole) : "";
}

export function parseCaptionJson(raw: string): PhotoCaption & { facts: AwardFacts } {
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
    organiser: String(parsed.organiser ?? parsed.organizer ?? "").trim().slice(0, 160),
    officialName: String(parsed.officialName ?? parsed.awardName ?? "").trim().slice(0, 200),
    achievementRank: String(parsed.achievementRank ?? parsed.rank ?? "").trim().slice(0, 120),
    role: asRole(parsed.role),
    photoPurpose: asPurpose(parsed.photoPurpose),
    nameOnEvidence: asBool(parsed.nameOnEvidence) || asBool(parsed.namePrinted),
    childReflection: String(parsed.childReflection ?? "").trim().slice(0, 1000),
    facts: parseAwardDetect(jsonText),
  };
}
