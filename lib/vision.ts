import sharp from "sharp";
import type { PhotoAnalysis } from "./types";
import { geminiGenerate, mimeFromFilename } from "./gemini";

function moodFromColors(colors: string[]): string {
  const joined = colors.join(" ").toLowerCase();
  if (/#(0|1|2)[0-9a-f]{5}/.test(joined)) return "intimate and reflective";
  if (/#(e|f)[0-9a-f]{5}/.test(joined)) return "bright and open";
  if (/#(3|4|5)[89a-f][0-9a-f]{4}/.test(joined)) return "calm and grounded";
  return "warm and attentive";
}

async function extractPalette(buffer: Buffer): Promise<string[]> {
  const { data, info } = await sharp(buffer)
    .resize(48, 48, { fit: "cover" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const buckets = new Map<string, number>();
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;
    const key = `#${[r, g, b]
      .map((v) => Math.round(v / 32) * 32)
      .map((v) => Math.min(255, v).toString(16).padStart(2, "0"))
      .join("")}`;
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return [...buckets.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([color]) => color);
}

async function localAnalyze(buffer: Buffer, filename: string): Promise<PhotoAnalysis> {
  const image = sharp(buffer);
  const meta = await image.metadata();
  const colors = await extractPalette(buffer);
  const mood = moodFromColors(colors);
  const orientation =
    (meta.width ?? 0) > (meta.height ?? 0)
      ? "wide frame"
      : (meta.height ?? 0) > (meta.width ?? 0)
        ? "portrait frame"
        : "square frame";
  const nameHint = filename.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();

  return {
    summary: `A ${orientation} memory${nameHint ? ` labeled “${nameHint}”` : ""} with a ${mood} palette. Visual cues suggest a moment worth keeping in this person’s story.`,
    tags: [orientation.split(" ")[0], mood.split(" ")[0], meta.format ?? "photo"].filter(Boolean),
    mood,
    setting: "Inferred from visual atmosphere — add notes to sharpen context",
    peopleVisible: "Presence suggested; confirm who appears in the track record",
    colors,
    sparklingMoment: `The ${colors[0] ?? "leading"} tones mark a standout beat — treat this as a candidate sparkling hour.`,
    source: "local",
  };
}

async function geminiAnalyze(buffer: Buffer, filename: string): Promise<PhotoAnalysis | null> {
  // Keep payloads token-safe: resize large images before sending.
  const compact = await sharp(buffer)
    .rotate()
    .resize(1280, 1280, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toBuffer();

  const text = await geminiGenerate({
    system:
      "You analyze personal memory photos for a portfolio report. Return JSON only with keys: summary, tags (string[]), mood, setting, peopleVisible, colors (hex string[]), sparklingMoment.",
    json: true,
    temperature: 0.35,
    maxOutputTokens: 1024,
    parts: [
      {
        text: `Filename: ${filename}. Describe the photo content for a warm, precise memory system. Focus on activity, emotion, setting, and what makes this a sparkling hour.`,
      },
      {
        inline_data: {
          mime_type: "image/jpeg",
          data: compact.toString("base64"),
        },
      },
    ],
  });

  if (!text) return null;

  const parsed = JSON.parse(text) as Partial<PhotoAnalysis>;
  return {
    summary: parsed.summary || "Memorable captured moment",
    tags: Array.isArray(parsed.tags) ? parsed.tags.map(String).slice(0, 8) : [],
    mood: parsed.mood || "warm",
    setting: parsed.setting || "unspecified",
    peopleVisible: parsed.peopleVisible || "unspecified",
    colors: Array.isArray(parsed.colors) ? parsed.colors.map(String).slice(0, 5) : [],
    sparklingMoment: parsed.sparklingMoment || parsed.summary || "A standout frame",
    source: "gemini",
  };
}

async function openaiAnalyze(buffer: Buffer, filename: string): Promise<PhotoAnalysis | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const base64 = buffer.toString("base64");
  const mime = mimeFromFilename(filename);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_VISION_MODEL || "gpt-4o-mini",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You analyze personal memory photos for a portfolio report. Return JSON with keys: summary, tags (string[]), mood, setting, peopleVisible, colors (hex string[]), sparklingMoment.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Filename: ${filename}. Describe the photo content for a warm, precise memory system. Focus on activity, emotion, and what makes this a sparkling hour.`,
            },
            {
              type: "image_url",
              image_url: { url: `data:${mime};base64,${base64}` },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    console.error("OpenAI vision failed", await response.text());
    return null;
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) return null;

  const parsed = JSON.parse(content) as Partial<PhotoAnalysis>;
  return {
    summary: parsed.summary || "Memorable captured moment",
    tags: parsed.tags || [],
    mood: parsed.mood || "warm",
    setting: parsed.setting || "unspecified",
    peopleVisible: parsed.peopleVisible || "unspecified",
    colors: parsed.colors || [],
    sparklingMoment: parsed.sparklingMoment || parsed.summary || "A standout frame",
    source: "openai",
  };
}

export async function analyzePhoto(buffer: Buffer, filename: string): Promise<PhotoAnalysis> {
  try {
    const gemini = await geminiAnalyze(buffer, filename);
    if (gemini) return gemini;
  } catch (error) {
    console.error("Gemini vision error, trying fallbacks", error);
  }

  try {
    const openai = await openaiAnalyze(buffer, filename);
    if (openai) return openai;
  } catch (error) {
    console.error("OpenAI vision error, falling back to local analysis", error);
  }

  return localAnalyze(buffer, filename);
}
