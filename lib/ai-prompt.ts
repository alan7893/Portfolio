import type { Locale } from "@/lib/i18n";

export type AiProvider = "gemini" | "deepseek";
export type AiKind = "portfolio" | "testimonial" | "memory";

export type EventSummary = {
  title: string;
  eventType: string;
  eventDate: string;
  description: string | null;
  category: string | null;
  location: string | null;
  achievementRank: string | null;
  status: string;
  tags: string[];
};

export type ChildSummary = {
  name: string;
  birthDate: string;
  school: string | null;
  notes: string | null;
  events: EventSummary[];
};

const KIND_INSTRUCTIONS: Record<
  AiKind,
  { "zh-HK": string; en: string }
> = {
  portfolio: {
    "zh-HK":
      "請根據以下成長紀錄，寫一份清晰、溫暖而且具體嘅作品集分析。包括：性格同興趣觀察、強項、成長軌跡、值得繼續培養嘅方向。用條列加短段落，避免空泛讚美。",
    en: "Write a clear, warm and specific portfolio analysis from the records below. Cover personality and interests, strengths, growth trajectory, and areas to keep nurturing. Use short sections and bullets. Avoid generic praise.",
  },
  testimonial: {
    "zh-HK":
      "請根據紀錄草擬一封家長／老師可用嘅推薦信或評語。語氣正式而親切，引用具體事件同成績，長度約 250–400 字。",
    en: "Draft a parent/teacher testimonial from the records. Tone: formal but warm. Cite specific events and results. About 250–400 words.",
  },
  memory: {
    "zh-HK":
      "請把紀錄編成一篇溫馨嘅成長回憶文，適合家庭珍藏。按時間順序，帶出情感同細節，結尾寄語小朋友。",
    en: "Turn the records into a warm memory piece for the family album. Chronological, with feeling and detail, ending with a note to the child.",
  },
};

export function buildAiMessages(
  child: ChildSummary,
  kind: AiKind,
  locale: Locale,
): { system: string; user: string } {
  const lang = locale === "en" ? "English" : "Hong Kong Cantonese (written 廣東話, not Mandarin)";
  const instruction = KIND_INSTRUCTIONS[kind][locale === "en" ? "en" : "zh-HK"];

  const system = [
    "You are a careful family portfolio assistant for parents.",
    `Write the entire answer in ${lang}.`,
    "Only use facts present in the provided records. If something is unknown, say so briefly.",
    "Do not invent prizes, ranks, schools, or dates.",
    "Do not mention that you are an AI unless asked.",
  ].join(" ");

  const lines: string[] = [
    `Child: ${child.name}`,
    `Birth date: ${child.birthDate}`,
    child.school ? `School: ${child.school}` : null,
    child.notes ? `Notes: ${child.notes}` : null,
    "",
    `Task: ${instruction}`,
    "",
    `Events (${child.events.length}):`,
  ].filter((v): v is string => v !== null);

  if (child.events.length === 0) {
    lines.push("(no events yet)");
  } else {
    for (const e of child.events) {
      const bits = [
        `${e.eventDate} [${e.eventType}/${e.status}] ${e.title}`,
        e.achievementRank ? `result: ${e.achievementRank}` : null,
        e.category ? `category: ${e.category}` : null,
        e.location ? `location: ${e.location}` : null,
        e.tags.length ? `tags: ${e.tags.join(", ")}` : null,
        e.description ? e.description : null,
      ].filter(Boolean);
      lines.push(`- ${bits.join(" | ")}`);
    }
  }

  return { system, user: lines.join("\n") };
}
