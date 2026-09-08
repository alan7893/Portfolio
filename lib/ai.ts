import { buildAiMessages, type AiKind, type AiProvider, type ChildSummary } from "@/lib/ai-prompt";
import { buildCaptionPrompt, parseCaptionJson, refineCaption, type PhotoCaption } from "@/lib/ai-caption";
import type { Locale } from "@/lib/i18n";

function runtimeEnv(name: string): string {
  // Bracket access so Next.js does not inline these at build time.
  return (process.env[name] ?? "").trim();
}

const GEMINI_OPENAI_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const GEMINI_NATIVE_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";

function geminiModels(): string[] {
  return [
    runtimeEnv("GEMINI_MODEL"),
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-flash-latest",
    "gemini-2.5-flash",
  ].filter((m, i, arr): m is string => Boolean(m) && arr.indexOf(m) === i);
}

const DEEPSEEK_MODEL = runtimeEnv("DEEPSEEK_MODEL") || "deepseek-chat";

export function getAiKeys() {
  const gemini =
    runtimeEnv("GEMINI_API_KEY") ||
    runtimeEnv("GEMINI_LUMEN_API_KEY") ||
    runtimeEnv("GOOGLE_API_KEY") ||
    runtimeEnv("GOOGLE_GENERATIVE_AI_API_KEY");
  const deepseek = runtimeEnv("DEEPSEEK_API_KEY");
  return { gemini, deepseek };
}

export function availableProviders(): Record<AiProvider, boolean> {
  const keys = getAiKeys();
  return {
    gemini: Boolean(keys.gemini),
    deepseek: Boolean(keys.deepseek),
  };
}

export class AiError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.status = status;
  }
}

async function chatCompletions(
  url: string,
  apiKey: string,
  model: string,
  system: string,
  user: string,
): Promise<string> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.6,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
    signal: AbortSignal.timeout(60_000),
  });

  const text = await res.text();
  let json: {
    error?: { message?: string };
    choices?: Array<{ message?: { content?: string } }>;
  } = {};
  try {
    json = JSON.parse(text) as typeof json;
  } catch {
    json = {};
  }

  if (!res.ok) {
    throw new AiError(
      json.error?.message || `Provider HTTP ${res.status}`,
      res.status >= 400 && res.status < 500 ? res.status : 502,
    );
  }

  const content = json.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new AiError("The model returned an empty reply.");
  }
  return content;
}

async function geminiNative(
  apiKey: string,
  model: string,
  system: string,
  user: string,
  image?: { mimeType: string; dataBase64: string },
  jsonMode = false,
): Promise<string> {
  const url = `${GEMINI_NATIVE_BASE}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const userParts: Array<Record<string, unknown>> = [{ text: user }];
  if (image) {
    userParts.unshift({
      inlineData: { mimeType: image.mimeType, data: image.dataBase64 },
    });
  }
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: userParts }],
      generationConfig: {
        temperature: 0.3,
        ...(jsonMode ? { responseMimeType: "application/json" } : {}),
      },
    }),
    signal: AbortSignal.timeout(60_000),
  });
  const json = (await res.json().catch(() => ({}))) as {
    error?: { message?: string };
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  if (!res.ok) {
    throw new AiError(
      json.error?.message || `Gemini HTTP ${res.status}`,
      res.status >= 400 && res.status < 500 ? res.status : 502,
    );
  }
  const content = json.candidates?.[0]?.content?.parts
    ?.map((p) => p.text ?? "")
    .join("")
    .trim();
  if (!content) {
    throw new AiError("The model returned an empty reply.");
  }
  return content;
}

async function completeGemini(
  system: string,
  user: string,
  image?: { mimeType: string; dataBase64: string },
): Promise<string> {
  const key = getAiKeys().gemini;
  if (!key) {
    throw new AiError("Gemini API key is not configured.", 501);
  }

  let last: unknown;
  for (const model of geminiModels()) {
    try {
      return await geminiNative(key, model, system, user, image, Boolean(image));
    } catch (err) {
      last = err;
      if (image) {
        try {
          return await geminiNative(key, model, system, user, image, false);
        } catch (err2) {
          last = err2;
        }
      }
    }
    if (!image) {
      try {
        return await chatCompletions(GEMINI_OPENAI_URL, key, model, system, user);
      } catch (err) {
        last = err;
      }
    }
  }
  if (last instanceof AiError) throw last;
  throw new AiError("Gemini request failed.");
}

async function completeDeepseek(system: string, user: string): Promise<string> {
  const key = getAiKeys().deepseek;
  if (!key) {
    throw new AiError("DeepSeek API key is not configured.", 501);
  }
  return chatCompletions(DEEPSEEK_URL, key, DEEPSEEK_MODEL, system, user);
}

export async function generatePortfolioAnalysis(opts: {
  provider: AiProvider;
  kind: AiKind;
  locale: Locale;
  child: ChildSummary;
}): Promise<{ text: string; provider: AiProvider; modelHint: string }> {
  const { system, user } = buildAiMessages(opts.child, opts.kind, opts.locale);
  if (opts.provider === "gemini") {
    const text = await completeGemini(system, user);
    return { text, provider: "gemini", modelHint: geminiModels()[0] ?? "gemini" };
  }
  const text = await completeDeepseek(system, user);
  return { text, provider: "deepseek", modelHint: DEEPSEEK_MODEL };
}

export async function captionPhoto(opts: {
  locale: Locale;
  mimeType: string;
  dataBase64: string;
}): Promise<PhotoCaption & { provider: "gemini" }> {
  const { system, user } = buildCaptionPrompt(opts.locale);
  const raw = await completeGemini(system, user, {
    mimeType: opts.mimeType,
    dataBase64: opts.dataBase64,
  });
  const caption = refineCaption(parseCaptionJson(raw), opts.locale);
  if (!caption.title) {
    throw new AiError("The model did not describe what is in the photo.", 502);
  }
  return { ...caption, provider: "gemini" };
}
