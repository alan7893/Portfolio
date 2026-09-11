import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  collectUploadedFiles,
  stageUploadedFile,
  validateFile,
  mediaWriteErrorMessage,
  readStagedBytes,
} from "@/lib/uploads";
import { resolvePhotoTakenAt } from "@/lib/photo-vision";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id ?? "anon";
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
    return NextResponse.json(
      {
        error: err.startsWith("tooLarge")
          ? "A photo is larger than 25MB."
          : "That photo type is not supported. Use JPEG, PNG, WebP, HEIC, MP4 or PDF.",
      },
      { status: 400 },
    );
  }

  try {
    const staged = await stageUploadedFile(file, userId);
    let suggestedDate: string | null = null;
    if (staged.fileType.startsWith("image/")) {
      const packed = await readStagedBytes(userId, staged.id);
      if (packed) {
        suggestedDate = await resolvePhotoTakenAt(packed.bytes, staged.originalName);
      }
    }
    return NextResponse.json({
      id: staged.id,
      originalName: staged.originalName,
      fileType: staged.fileType,
      sizeBytes: staged.sizeBytes,
      suggestedDate,
    });
  } catch (e) {
    console.error("[media/stage] write failed", e);
    return NextResponse.json({ error: mediaWriteErrorMessage(e) }, { status: 500 });
  }
}
