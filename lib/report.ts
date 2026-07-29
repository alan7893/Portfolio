import { format, parseISO } from "date-fns";
import type { Person, PhotoMemory, PortfolioReport, TrackRecord } from "./types";

const CATEGORY_LABEL: Record<TrackRecord["category"], string> = {
  work: "work craft",
  growth: "personal growth",
  relationship: "relationships",
  milestone: "milestones",
  other: "life texture",
};

function topThemes(records: TrackRecord[], photos: PhotoMemory[]): string[] {
  const counts = new Map<string, number>();
  for (const record of records) {
    const label = CATEGORY_LABEL[record.category];
    counts.set(label, (counts.get(label) ?? 0) + 2 + record.highlight);
  }
  for (const photo of photos) {
    for (const tag of photo.analysis.tags.slice(0, 3)) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    counts.set(photo.analysis.mood.split(" ")[0], (counts.get(photo.analysis.mood.split(" ")[0]) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([theme]) => theme);
}

function cadenceLabel(records: TrackRecord[], photos: PhotoMemory[]): string {
  const total = records.length + photos.length;
  if (total === 0) return "Quiet archive — ready for first entries";
  if (total < 4) return "Emerging rhythm — early signals are forming";
  if (total < 10) return "Steady documentation — a clear pattern is visible";
  return "Rich chronicle — dense with lived detail";
}

export function generateReport(
  person: Person,
  photos: PhotoMemory[],
  records: TrackRecord[],
): PortfolioReport {
  const themes = topThemes(records, photos);
  const sortedRecords = [...records].sort((a, b) => b.highlight - a.highlight || b.date.localeCompare(a.date));
  const topRecords = sortedRecords.slice(0, 3);
  const topPhotos = [...photos]
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
    .slice(0, 3);

  const strengths = [
    ...topRecords.map((r) => `${r.title}: ${r.notes.slice(0, 120)}${r.notes.length > 120 ? "…" : ""}`),
    ...topPhotos.map((p) => p.analysis.sparklingMoment),
  ].slice(0, 4);

  if (strengths.length === 0) {
    strengths.push(
      "Curiosity to preserve moments",
      "Willingness to reflect in writing",
      "Potential for a vivid personal portfolio",
    );
  }

  const moments: PortfolioReport["sparklingHours"]["moments"] = [
    ...topRecords.map((r) => ({
      title: r.title,
      when: safeDate(r.date),
      why: r.notes || `Highlight intensity ${r.highlight}/5 in ${CATEGORY_LABEL[r.category]}`,
      source: "record" as const,
    })),
    ...topPhotos.map((p) => ({
      title: p.analysis.tags[0] ? `Photo · ${p.analysis.tags[0]}` : "Photo memory",
      when: safeDate(p.uploadedAt),
      why: p.analysis.sparklingMoment || p.analysis.summary,
      source: "photo" as const,
    })),
  ]
    .sort((a, b) => b.when.localeCompare(a.when))
    .slice(0, 5);

  const activitySummary =
    records.length || photos.length
      ? `${person.name} shows ${records.length} track record${records.length === 1 ? "" : "s"} and ${photos.length} photo memor${photos.length === 1 ? "y" : "ies"}. Dominant themes: ${themes.slice(0, 3).join(", ") || "emerging"}.`
      : `No memories yet for ${person.name}. Upload photos and add track records to shape their portfolio.`;

  const encouragement =
    topRecords[0]?.highlight >= 4
      ? `${person.name} already has high-sparkle moments on file — keep capturing the conditions that produce them.`
      : `Protect time for reflection. Even small notes compound into a clear portrait of ${person.name}'s strengths.`;

  return {
    personId: person.id,
    generatedAt: new Date().toISOString(),
    activity: {
      headline: records.length + photos.length > 0 ? "Activity in motion" : "Awaiting first signals",
      summary: activitySummary,
      themes: themes.length ? themes : ["ready to begin"],
      cadence: cadenceLabel(records, photos),
    },
    positiveFeedback: {
      headline: "What shines",
      strengths,
      encouragement,
    },
    sparklingHours: {
      headline: "Sparkling hours",
      moments:
        moments.length > 0
          ? moments
          : [
              {
                title: "First light pending",
                when: "Soon",
                why: "Upload a photo or log a highlight to pin the first sparkling hour.",
                source: "record",
              },
            ],
    },
    narrative: buildNarrative(person, themes, topRecords[0], topPhotos[0]),
  };
}

function safeDate(value: string): string {
  try {
    return format(parseISO(value), "MMM d, yyyy");
  } catch {
    return value.slice(0, 10);
  }
}

function buildNarrative(
  person: Person,
  themes: string[],
  topRecord?: TrackRecord,
  topPhoto?: PhotoMemory,
): string {
  const role = person.role ? ` (${person.role})` : "";
  const themeText = themes.length ? themes.slice(0, 3).join(", ") : "an open horizon";
  const peak = topRecord
    ? `A defining note is “${topRecord.title}.”`
    : topPhoto
      ? `A defining frame reads: ${topPhoto.analysis.summary}`
      : "Their portfolio is a blank page with bright potential.";

  return `${person.name}${role} is assembling a living portfolio around ${themeText}. ${peak} This report stitches activity, affirmation, and sparkling hours into one readable portrait.`;
}
