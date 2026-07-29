const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export function getGeminiApiKey(): string | null {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    null
  );
}

export function isGeminiConfigured(): boolean {
  return Boolean(getGeminiApiKey());
}

export type GeminiPart =
  | { text: string }
  | { inline_data: { mime_type: string; data: string } };

type GeminiGenerateOptions = {
  parts: GeminiPart[];
  system?: string;
  temperature?: number;
  maxOutputTokens?: number;
  json?: boolean;
};

export async function geminiGenerate({
  parts,
  system,
  temperature = 0.5,
  maxOutputTokens = 4096,
  json = false,
}: GeminiGenerateOptions): Promise<string | null> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature,
      maxOutputTokens,
      ...(json ? { responseMimeType: "application/json" } : {}),
    },
  };

  if (system) {
    body.systemInstruction = {
      parts: [{ text: system }],
    };
  }

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("Gemini generate failed", response.status, detail.slice(0, 500));
    throw new Error(`Gemini request failed (${response.status})`);
  }

  const jsonResponse = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const text = jsonResponse.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();

  return text || null;
}

export function mimeFromFilename(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".heic")) return "image/heic";
  if (lower.endsWith(".heif")) return "image/heif";
  return "image/jpeg";
}
