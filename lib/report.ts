import { format, parseISO } from "date-fns";
import type { Person, PhotoMemory, PortfolioReport, TrackRecord } from "./types";
import { geminiGenerate, isGeminiConfigured } from "./gemini";

const CATEGORY_LABEL: Record<TrackRecord["category"], string> = {
  work: "work craft",
  growth: "personal growth",
  relationship: "relationships",
  milestone: "milestones",
  other: "life texture",
};

/** Token-safe caps so reports stay cheap even with large archives. */
const MAX_PHOTOS_FOR_REPORT = 12;
const MAX_RECORDS_FOR_REPORT = 20;

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

function selectTokenSafeInputs(photos: PhotoMemory[], records: TrackRecord[]) {
  const selectedRecords = [...records]
    .sort((a, b) => b.highlight - a.highlight || b.date.localeCompare(a.date))
    .slice(0, MAX_RECORDS_FOR_REPORT);

  const selectedPhotos = [...photos]
    .sort((a, b) => {
      const aScore = a.analysis.source === "gemini" || a.analysis.source === "openai" ? 2 : 1;
      const bScore = b.analysis.source === "gemini" || b.analysis.source === "openai" ? 2 : 1;
      return bScore - aScore || b.uploadedAt.localeCompare(a.uploadedAt);
    })
    .slice(0, MAX_PHOTOS_FOR_REPORT);

  return { selectedPhotos, selectedRecords };
}

function estimatePages(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 450));
}

function buildLocalReport(
  person: Person,
  photos: PhotoMemory[],
  records: TrackRecord[],
): PortfolioReport {
  const { selectedPhotos, selectedRecords } = selectTokenSafeInputs(photos, records);
  const themes = topThemes(selectedRecords, selectedPhotos);
  const topRecords = selectedRecords.slice(0, 3);
  const topPhotos = selectedPhotos.slice(0, 3);

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

  const narrative = buildNarrative(person, themes, topRecords[0], topPhotos[0]);

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
    narrative,
    source: "local",
    pagesEstimate: estimatePages(narrative),
    model: null,
  };
}

async function buildGeminiReport(
  person: Person,
  photos: PhotoMemory[],
  records: TrackRecord[],
): Promise<PortfolioReport | null> {
  if (!isGeminiConfigured()) return null;

  const { selectedPhotos, selectedRecords } = selectTokenSafeInputs(photos, records);
  const themes = topThemes(selectedRecords, selectedPhotos);

  const photoDigest = selectedPhotos
    .map(
      (p, i) =>
        `${i + 1}. [${safeDate(p.uploadedAt)}] ${p.analysis.summary} | mood: ${p.analysis.mood} | setting: ${p.analysis.setting} | sparkling: ${p.analysis.sparklingMoment} | tags: ${p.analysis.tags.join(", ")}`,
    )
    .join("\n");

  const recordDigest = selectedRecords
    .map(
      (r, i) =>
        `${i + 1}. [${r.date}] ${r.title} (${r.category}, sparkle ${r.highlight}/5): ${r.notes || "(no notes)"}`,
    )
    .join("\n");

  const prompt = `Create a warm, specific personal portfolio report for ${person.name}${person.role ? ` (${person.role})` : ""}.

Archive size: ${photos.length} photos, ${records.length} track records.
Token-safe digest used for writing: ${selectedPhotos.length} photo summaries + ${selectedRecords.length} records.
Suggested themes: ${themes.join(", ") || "emerging identity"}.

PHOTO SUMMARIES:
${photoDigest || "(none yet)"}

TRACK RECORDS:
${recordDigest || "(none yet)"}

Return JSON with this exact shape:
{
  "activity": { "headline": string, "summary": string, "themes": string[], "cadence": string },
  "positiveFeedback": { "headline": string, "strengths": string[], "encouragement": string },
  "sparklingHours": { "headline": string, "moments": [{"title": string, "when": string, "why": string, "source": "photo"|"record"}] },
  "narrative": string,
  "pagesEstimate": number
}

Narrative requirements:
- Write a polished 4 to 8 page style narrative (about 1800-3600 words).
- Use short titled sections inside the narrative string, separated by blank lines.
- Include sections covering: opening portrait, activity arc, strengths, sparkling hours, growth trajectory, and closing encouragement.
- Stay grounded in the provided evidence. Do not invent facts not supported by the digests.
- Keep tone warm, concrete, and portfolio-ready.`;

  const text = await geminiGenerate({
    system:
      "You are Lumen, a memory-portfolio writer. Produce accurate, encouraging portfolio reports from photo summaries and track records. Output JSON only.",
    json: true,
    temperature: 0.55,
    maxOutputTokens: 8192,
    parts: [{ text: prompt }],
  });

  if (!text) return null;

  const parsed = JSON.parse(text) as Partial<PortfolioReport> & {
    pagesEstimate?: number;
  };

  const narrative = typeof parsed.narrative === "string" ? parsed.narrative : "";
  if (!narrative) return null;

  return {
    personId: person.id,
    generatedAt: new Date().toISOString(),
    activity: {
      headline: parsed.activity?.headline || "Activity in motion",
      summary: parsed.activity?.summary || cadenceLabel(records, photos),
      themes: parsed.activity?.themes?.length ? parsed.activity.themes : themes,
      cadence: parsed.activity?.cadence || cadenceLabel(records, photos),
    },
    positiveFeedback: {
      headline: parsed.positiveFeedback?.headline || "What shines",
      strengths: parsed.positiveFeedback?.strengths?.length
        ? parsed.positiveFeedback.strengths
        : ["Evidence of intentional growth"],
      encouragement:
        parsed.positiveFeedback?.encouragement ||
        `Keep recording the moments that make ${person.name} distinct.`,
    },
    sparklingHours: {
      headline: parsed.sparklingHours?.headline || "Sparkling hours",
      moments: parsed.sparklingHours?.moments?.length
        ? parsed.sparklingHours.moments.map((m) => ({
            title: m.title,
            when: m.when,
            why: m.why,
            source: m.source === "photo" ? "photo" : "record",
          }))
        : [],
    },
    narrative,
    source: "gemini",
    pagesEstimate: parsed.pagesEstimate || estimatePages(narrative),
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  };
}

export async function generateReport(
  person: Person,
  photos: PhotoMemory[],
  records: TrackRecord[],
): Promise<PortfolioReport> {
  try {
    const aiReport = await buildGeminiReport(person, photos, records);
    if (aiReport) return aiReport;
  } catch (error) {
    console.error("Gemini report generation failed, using local report", error);
  }
  return buildLocalReport(person, photos, records);
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
