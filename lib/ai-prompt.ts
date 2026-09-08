import type { Locale } from "@/lib/i18n";
import {
  type AiKind,
  normalizeAiKind,
  wuYuForCategory,
  type PhotoPurpose,
  type ParticipationRole,
} from "@/lib/hk-portfolio";

export type { AiKind };
export type AiProvider = "gemini" | "deepseek";

export type EventSummary = {
  title: string;
  eventType: string;
  eventDate: string;
  description: string | null;
  category: string | null;
  location: string | null;
  achievementRank: string | null;
  organiser: string | null;
  officialName: string | null;
  role: string | null;
  childReflection: string | null;
  nameOnEvidence: boolean;
  photoPurpose: string | null;
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

const KIND_INSTRUCTIONS: Record<AiKind, { "zh-HK": string; en: string }> = {
  p1: {
    "zh-HK":
      "請按香港小一叩門／小一面試作品集慣例，用已有紀錄寫一份精簡稿，約等於 4 頁 A4 的內容量。結構必須係：1) 封面簡介（姓名、年齡／生日、學校、性格、興趣，約 200–300 字）；2) 學習歷程（K1–而家），每項只寫日期、背景、小朋友感受／學到乜，唔好堆證書；3) 課外活動同成就（最多 3–5 件有故事嘅項目，體育／音樂／義工／表演都可以）；4) 家長觀察同教育理念草稿（真摯、謙遜，唔好空洞讚美）。相片重點：生活照、閱讀、手工、家庭，而唔係獎狀牆。唔好發明獎項或日期。最後用 3 句提示家長要按每間學校辦學理念改一版，唔好一份稿打天下。",
    en: "Write a Hong Kong Primary 1 interview / 叩門 portfolio draft from the records, about 4 A4 pages of text. Required structure: 1) cover intro (name, age/birthday, school, personality, interests, 200–300 words); 2) learning journey with a short caption per item: date, background, the child’s feeling or what they learned — do not dump certificates; 3) ECA and achievements (3–5 items with a story: sport, music, service, performance); 4) a humble parent-observation / education-philosophy draft. Prefer lifestyle photos (play, reading, crafts, family) over a wall of certificates. Do not invent prizes or dates. End with 3 sentences reminding the parent to retune the draft to each school’s mission.",
  },
  s1: {
    "zh-HK":
      "請按香港中一自行分配學位（SSPA DP）同面試檔案慣例整理紀錄。教育局規定：參加派位中學最多申請兩間、唔設筆試、收生準則由學校公布。唔好寫小學推薦信（除非紀錄話學校有要求）。輸出：1) 五育對照表（德智體群美），只根據紀錄入面嘅類別；2) 1–2 個持續參與嘅故事（興趣、角色、年份），而唔係證書清單；3) 課外活動分桶：群體、社會服務、體育、音樂、朗誦、美術、領袖、STEAM（有就寫，冇就話未有紀錄）；4) 面試可用嘅具體例子 5 條；5) 建議交學校嘅證書上限約 10 份，列出最值得保留嘅項目。唔好發明名次。",
    en: "Write a Hong Kong S1 Discretionary Places (SSPA DP) interview file from the records. EDB rules: at most two participating secondary schools, no written exam, each school publishes its own criteria. Do not draft a primary-school recommendation letter unless a record says the school asked for one. Output: 1) a 五育 (moral, intellectual, physical, social, aesthetic) map from recorded categories only; 2) one or two sustained-interest stories (role + years), not a certificate dump; 3) ECA buckets: group, service, sport, music, speech, visual arts, leadership, STEAM — say when a bucket has no record; 4) five concrete interview examples; 5) a shortlist of about 10 certificates worth keeping. Do not invent ranks.",
  },
  jupas: {
    "zh-HK":
      "請按 JUPAS OEA（比賽／活動的經驗及成就）格式整理。最多 10 項。每一項用固定欄位：正式活動／獎項名稱、範疇、年份、參與形式、性質、角色、有獎定無獎、獎項類型、不多於 40 字描述。若證明未見申請人全名、正式名稱、年份或獎項類型，該項標「證明不足」，唔好當已齊。之後草擬 Optional Additional Information（中文或英文 500 字內），只寫一件對成長最有意義嘅經歷，具體、反思、唔好空泛。提及：抽查證明接受證書／學校信／有姓名嘅獎牌相；唔接受冇姓名嘅獎牌或證書；檔案 PDF/JPG/PNG 且 ≤1MB。",
    en: "Format the records as JUPAS OEA (Other Experiences and Achievements). Cap at 10 items. For each item use: official activity/award name, domain, year, participation mode, nature, role, award vs non-award, award type, and a description of at most 40 words. If proof is missing the applicant’s full name, official name, year, or award type, mark the item “evidence incomplete” and do not treat it as ready. Then draft the optional Additional Information (≤500 words) on one experience that shaped growth — concrete and reflective. Note that sampled proof may be a certificate, school letter, or a medal photo showing the applicant’s name; unnamed medals/certificates are not accepted; files must be PDF/JPG/PNG ≤1MB.",
  },
  testimonial: {
    "zh-HK":
      "請根據紀錄草擬一封家長／老師可用嘅推薦信或小一自薦信。語氣正式而親切，引用具體事件同成績，長度約 300–400 字。謙遜，避免吹捧。如果紀錄有學校名，可以提一句點樣配合該校，但唔好假裝已讀過辦學理念。",
    en: "Draft a parent/teacher testimonial or Primary 1 self-recommendation letter from the records. Formal but warm, 300–400 words, citing specific events. Stay humble. If a school name is present, one sentence on fit is enough — do not pretend you have read that school’s mission.",
  },
  memory: {
    "zh-HK":
      "請把紀錄編成一篇溫馨嘅成長回憶文，適合家庭珍藏。按時間順序，帶出情感同細節，結尾寄語小朋友。",
    en: "Turn the records into a warm memory piece for the family album. Chronological, with feeling and detail, ending with a note to the child.",
  },
};

function eventLine(e: EventSummary): string {
  const pillars = wuYuForCategory(e.category);
  const bits = [
    `${e.eventDate} [${e.eventType}/${e.status}] ${e.title}`,
    e.officialName ? `official: ${e.officialName}` : null,
    e.organiser ? `organiser: ${e.organiser}` : null,
    e.role ? `role: ${e.role}` : null,
    e.achievementRank ? `result: ${e.achievementRank}` : null,
    e.category ? `category: ${e.category}` : null,
    pillars.length ? `五育: ${pillars.join(",")}` : null,
    e.photoPurpose ? `photo: ${e.photoPurpose}` : null,
    e.location ? `location: ${e.location}` : null,
    e.nameOnEvidence ? "name-on-proof: yes" : "name-on-proof: no",
    e.tags.length ? `tags: ${e.tags.join(", ")}` : null,
    e.childReflection ? `child said/felt: ${e.childReflection}` : null,
    e.description ? e.description : null,
  ].filter(Boolean);
  return `- ${bits.join(" | ")}`;
}

export function buildAiMessages(
  child: ChildSummary,
  kind: AiKind | "portfolio",
  locale: Locale,
): { system: string; user: string } {
  const resolved = normalizeAiKind(kind);
  const lang = locale === "en" ? "English" : "Hong Kong Cantonese (written 廣東話, not Mandarin)";
  const instruction = KIND_INSTRUCTIONS[resolved][locale === "en" ? "en" : "zh-HK"];

  const system = [
    "You are a careful Hong Kong family portfolio assistant for parents.",
    `Write the entire answer in ${lang}.`,
    "Only use facts present in the provided records. If something is unknown, say so briefly.",
    "Do not invent prizes, ranks, schools, organisers, roles, or dates.",
    "Do not mention that you are an AI unless asked.",
    "If a prize photo has name-on-proof: no, warn that JUPAS-style evidence needs the child’s full name on the medal or certificate.",
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
      lines.push(eventLine(e));
    }
  }

  return { system, user: lines.join("\n") };
}

export type { PhotoPurpose, ParticipationRole };
