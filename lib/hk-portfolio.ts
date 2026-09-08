import { CATEGORIES } from "@/lib/constants";

/**
 * Hong Kong admission capture rules used by photo forms, evidence checks,
 * and AI portfolio templates.
 *
 * Sources (common practice + official rules; not school-specific):
 * - 小一叩門作品集: typically ~4 A4 pages; cover + intro + learning journey
 *   captions (date, background, feeling) + a few ECA/awards + parent notes.
 *   Lifestyle photos over a dump of certificates. Tailor to each school's 辦學理念.
 * - 中一自行分配學位 (EDB SSPA DP): schools publish their own criteria; no
 *   written exam; at most two participating schools. ECA/service is commonly
 *   10–40%. Photocopies of awards; no primary-school recommendation letters
 *   unless a school asks. Sustained interest > piles of participation certs.
 * - JUPAS OEA: up to 10 items + optional 500-word Additional Information.
 *   Evidence (if sampled) must show applicant's full name, official activity
 *   name, year, and award type. Medal photos need the applicant's name.
 *   File: PDF/JPG/PNG ≤ 1MB. Unnamed medals/certificates are rejected.
 */

export const PHOTO_PURPOSES = [
  "lifestyle",
  "activity",
  "certificate",
  "medal",
  "work",
  "family",
] as const;
export type PhotoPurpose = (typeof PHOTO_PURPOSES)[number];

export const PARTICIPATION_ROLES = [
  "participant",
  "team",
  "leader",
  "volunteer",
  "performer",
  "other",
] as const;
export type ParticipationRole = (typeof PARTICIPATION_ROLES)[number];

export const LIFE_STAGES = [
  "kinder",
  "p1",
  "s1",
  "jupas",
  "cv",
] as const;
export type LifeStage = (typeof LIFE_STAGES)[number];

export const AI_KINDS = [
  "kinder",
  "p1",
  "s1",
  "jupas",
  "cv",
  "testimonial",
  "memory",
] as const;
export type AiKind = (typeof AI_KINDS)[number];

export const WU_YU = ["moral", "intellectual", "physical", "social", "aesthetic"] as const;
export type WuYu = (typeof WU_YU)[number];

const CATEGORY_TO_WU_YU: Record<(typeof CATEGORIES)[number], WuYu[]> = {
  academic: ["intellectual"],
  language: ["intellectual"],
  sports: ["physical"],
  arts: ["aesthetic"],
  music: ["aesthetic"],
  leadership: ["moral", "social"],
  service: ["moral", "social"],
  family: ["moral"],
};

export type EvidenceInput = {
  eventType: string;
  photoPurpose: string | null | undefined;
  officialName: string | null | undefined;
  organiser: string | null | undefined;
  role: string | null | undefined;
  achievementRank: string | null | undefined;
  nameOnEvidence: boolean;
  childReflection: string | null | undefined;
  category: string | null | undefined;
  hasMedia: boolean;
  description: string | null | undefined;
};

export type EvidenceGap =
  | "photo"
  | "photoPurpose"
  | "officialName"
  | "organiser"
  | "role"
  | "rank"
  | "nameOnEvidence"
  | "reflection"
  | "category";

export function isEvidenceHeavy(input: Pick<EvidenceInput, "eventType" | "photoPurpose">): boolean {
  const purpose = input.photoPurpose ?? "";
  return (
    input.eventType === "PRIZE" ||
    input.eventType === "COMPETITION" ||
    purpose === "medal" ||
    purpose === "certificate"
  );
}

function filled(value: string | null | undefined): boolean {
  return Boolean(value && value.trim());
}

export function evidenceGaps(input: EvidenceInput): EvidenceGap[] {
  const gaps: EvidenceGap[] = [];
  if (!input.hasMedia) gaps.push("photo");
  if (!filled(input.photoPurpose)) gaps.push("photoPurpose");
  if (!filled(input.category)) gaps.push("category");

  if (isEvidenceHeavy(input)) {
    if (!filled(input.officialName)) gaps.push("officialName");
    if (!filled(input.organiser)) gaps.push("organiser");
    if (!filled(input.role)) gaps.push("role");
    if (input.eventType === "PRIZE" && !filled(input.achievementRank)) {
      gaps.push("rank");
    }
    if (!input.nameOnEvidence) gaps.push("nameOnEvidence");
  } else if (!filled(input.childReflection) && !filled(input.description)) {
    gaps.push("reflection");
  }

  return gaps;
}

export function ageInYears(birthDate: Date | string, on: Date = new Date()): number {
  const born = typeof birthDate === "string" ? new Date(birthDate) : birthDate;
  if (Number.isNaN(born.getTime()) || Number.isNaN(on.getTime())) return 0;
  let age = on.getFullYear() - born.getFullYear();
  const monthDiff = on.getMonth() - born.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && on.getDate() < born.getDate())) {
    age -= 1;
  }
  return Math.max(0, age);
}

/** Stage of life at a given age. One record can later appear in every later CV. */
export function lifeStageFromAge(age: number): LifeStage {
  if (age < 6) return "kinder";
  if (age < 8) return "p1";
  if (age < 13) return "s1";
  if (age < 19) return "jupas";
  return "cv";
}

export function stageAtDate(
  birthDate: Date | string,
  on: Date | string = new Date(),
): LifeStage {
  const when = typeof on === "string" ? new Date(on) : on;
  return lifeStageFromAge(ageInYears(birthDate, when));
}

export function suggestedTrack(
  birthDate: Date | string,
  now: Date = new Date(),
): LifeStage {
  return stageAtDate(birthDate, now);
}

export function stageCounts(
  birthDate: Date | string,
  events: Array<{ eventDate: Date | string }>,
): Record<LifeStage, number> {
  const counts: Record<LifeStage, number> = {
    kinder: 0,
    p1: 0,
    s1: 0,
    jupas: 0,
    cv: 0,
  };
  for (const event of events) {
    counts[stageAtDate(birthDate, event.eventDate)] += 1;
  }
  return counts;
}

export function normalizeAiKind(kind: string): AiKind {
  if (kind === "portfolio") return "p1";
  if ((AI_KINDS as readonly string[]).includes(kind)) return kind as AiKind;
  return "p1";
}

export function wuYuForCategory(category: string | null | undefined): WuYu[] {
  if (!category) return [];
  return CATEGORY_TO_WU_YU[category as (typeof CATEGORIES)[number]] ?? [];
}

export function wuYuCoverage(
  events: Array<{ category: string | null }>,
): Record<WuYu, number> {
  const counts: Record<WuYu, number> = {
    moral: 0,
    intellectual: 0,
    physical: 0,
    social: 0,
    aesthetic: 0,
  };
  for (const event of events) {
    for (const pillar of wuYuForCategory(event.category)) {
      counts[pillar] += 1;
    }
  }
  return counts;
}

export type TrackWarning =
  | "fewEvents"
  | "missingEvidence"
  | "certificateHeavy"
  | "thinWuYu"
  | "overTenAwards";

export function trackWarnings(
  kind: AiKind,
  events: Array<{
    eventType: string;
    photoPurpose?: string | null;
    officialName?: string | null;
    organiser?: string | null;
    role?: string | null;
    achievementRank?: string | null;
    nameOnEvidence?: boolean;
    childReflection?: string | null;
    category?: string | null;
    description?: string | null;
    hasMedia?: boolean;
  }>,
): TrackWarning[] {
  const warnings: TrackWarning[] = [];
  if (events.length < 3) warnings.push("fewEvents");

  const awards = events.filter(
    (e) => e.eventType === "PRIZE" || e.eventType === "COMPETITION",
  );
  const missing = awards.filter(
    (e) =>
      evidenceGaps({
        eventType: e.eventType,
        photoPurpose: e.photoPurpose,
        officialName: e.officialName,
        organiser: e.organiser,
        role: e.role,
        achievementRank: e.achievementRank,
        nameOnEvidence: Boolean(e.nameOnEvidence),
        childReflection: e.childReflection,
        category: e.category,
        hasMedia: e.hasMedia !== false,
        description: e.description,
      }).length > 0,
  );
  if (missing.length > 0) warnings.push("missingEvidence");

  if (kind === "p1") {
    const certLike = events.filter(
      (e) =>
        e.eventType === "PRIZE" ||
        e.photoPurpose === "certificate" ||
        e.photoPurpose === "medal",
    ).length;
    const lifestyle = events.filter(
      (e) =>
        e.photoPurpose === "lifestyle" ||
        e.photoPurpose === "activity" ||
        e.photoPurpose === "work" ||
        e.photoPurpose === "family" ||
        e.eventType === "PHOTO" ||
        e.eventType === "MILESTONE",
    ).length;
    if (certLike >= 4 && lifestyle < 2) warnings.push("certificateHeavy");
  }

  if (kind === "s1") {
    const coverage = wuYuCoverage(events.map((e) => ({ category: e.category ?? null })));
    const filledPillars = WU_YU.filter((p) => coverage[p] > 0).length;
    if (events.length >= 3 && filledPillars < 3) warnings.push("thinWuYu");
  }

  if (kind === "jupas" && awards.length > 10) warnings.push("overTenAwards");

  return warnings;
}
