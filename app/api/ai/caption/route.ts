import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { availableProviders, captionPhoto, AiError } from "@/lib/ai";
import { collectUploadedFiles, validateFile } from "@/lib/uploads";
import { mimeFromName } from "@/lib/constants";
import { checkRateLimit, registerFailedAttempt } from "@/lib/rateLimit";
import { DEFAULT_LOCALE, normalizeLocale } from "@/lib/i18n";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!availableProviders().gemini) {
    return NextResponse.json(
      { error: "Gemini API key is not configured for photo reading." },
      { status: 501 },
    );
  }

  const userId = (session.user as { id?: string }).id ?? "anon";
  const limit = checkRateLimit(`ai-caption:${userId}`);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests", retryAfterSeconds: limit.retryAfterSeconds },
      { status: 429 },
    );
  }

  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Expected a photo upload." }, { status: 400 });
  }

  const files = collectUploadedFiles(form, "file");
  const file = files[0];
  if (!file) {
    return NextResponse.json({ error: "No photo attached." }, { status: 400 });
  }
  const err = validateFile(file);
  if (err) {
    return NextResponse.json({ error: "Unsupported photo." }, { status: 400 });
  }
  const mime = file.type || mimeFromName(file.name);
  if (!mime.startsWith("image/")) {
    return NextResponse.json(
      { error: "AI caption works on photos (JPEG, PNG, WebP, HEIC)." },
      { status: 400 },
    );
  }

  const locale = normalizeLocale(String(form.get("locale") ?? DEFAULT_LOCALE));
  const buf = Buffer.from(await file.arrayBuffer());

  try {
    const caption = await captionPhoto({
      locale,
      mimeType: mime,
      dataBase64: buf.toString("base64"),
    });
    return NextResponse.json(caption);
  } catch (e) {
    registerFailedAttempt(`ai-caption:${userId}`);
    if (e instanceof AiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Could not read the photo." }, { status: 502 });
  }
}
