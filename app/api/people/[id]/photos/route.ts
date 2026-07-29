import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import { addPhoto, PUBLIC_UPLOADS_DIR, UPLOADS_DIR } from "@/lib/store";
import { analyzePhoto } from "@/lib/vision";
import type { PhotoMemory } from "@/lib/types";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id: personId } = await params;
  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image uploads are supported" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name) || ".jpg";
  const id = crypto.randomUUID();
  const filename = `${id}${ext}`;
  const diskPath = path.join(UPLOADS_DIR, filename);
  const publicPath = path.join(PUBLIC_UPLOADS_DIR, filename);

  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.mkdir(PUBLIC_UPLOADS_DIR, { recursive: true });
  await fs.writeFile(diskPath, bytes);
  await fs.writeFile(publicPath, bytes);

  const analysis = await analyzePhoto(bytes, file.name);
  const photo: PhotoMemory = {
    id,
    personId,
    filename: file.name,
    url: `/uploads/${filename}`,
    uploadedAt: new Date().toISOString(),
    analysis,
  };

  await addPhoto(photo);
  return NextResponse.json(photo, { status: 201 });
}
