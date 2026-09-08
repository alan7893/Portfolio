import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { availableProviders, captionPhoto, AiError } from "@/lib/ai";
import {
  collectUploadedFiles,
  collectStagedIds,
  readStagedBytes,
  validateFile,
} from "@/lib/uploads";
import { mimeFromName } from "@/lib/constants";
import { checkRateLimit, registerFailedAttempt } from "@/lib/rateLimit";
import { DEFAULT_LOCALE, normalizeLocale } from "@/lib/i18n";
import { prepareVisionJpeg } from "@/lib/photo-vision";
import { getPrivacySettings } from "@/lib/privacy.server";

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

  const privacy = await getPrivacySettings();
  if (!privacy.aiCaptionEnabled) {
    return NextResponse.json(
      { error: "Photo AI is turned off. The original stays only on this family server." },
      { status: 403 },
    );
  }

  const userId = session.user.id ?? "anon";
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

  let original: Buffer | null = null;
  const stagedId = collectStagedIds(form)[0];
  if (stagedId) {
    const staged = await readStagedBytes(userId, stagedId);
    if (!staged) {
      return NextResponse.json(
        { error: "Photo was not found on the server. Please choose it again." },
        { status: 400 },
      );
    }
    if (!staged.meta.fileType.startsWith("image/")) {
      return NextResponse.json(
        { error: "AI caption works on photos (JPEG, PNG, WebP, HEIC)." },
        { status: 400 },
      );
    }
    original = staged.bytes;
  } else {
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
    original = Buffer.from(await file.arrayBuffer());
  }

  const locale = normalizeLocale(String(form.get("locale") ?? DEFAULT_LOCALE));

  let vision;
  try {
    vision = await prepareVisionJpeg(original);
  } catch {
    return NextResponse.json(
      { error: "Could not read this photo for AI. Try JPEG or PNG." },
      { status: 400 },
    );
  }

  try {
    const caption = await captionPhoto({
      locale,
      mimeType: vision.mimeType,
      dataBase64: vision.dataBase64,
    });
    return NextResponse.json({
      title: caption.title,
      category: caption.category,
      eventType: caption.eventType,
      description: caption.description,
      tags: caption.tags,
      organiser: caption.organiser,
      officialName: caption.officialName,
      achievementRank: caption.achievementRank,
      role: caption.role,
      photoPurpose: caption.photoPurpose,
      nameOnEvidence: caption.nameOnEvidence,
      childReflection: caption.childReflection,
    });
  } catch (e) {
    registerFailedAttempt(`ai-caption:${userId}`);
    if (e instanceof AiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Could not read the photo." }, { status: 502 });
  }
}
