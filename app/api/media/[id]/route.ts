import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveStoredFile } from "@/lib/uploads";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const abs = resolveStoredFile(media.filePath);
  if (!abs) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  try {
    const data = await fs.readFile(abs);
    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        "Content-Type": media.fileType || "application/octet-stream",
        "Content-Length": String(media.sizeBytes),
        "Cache-Control": "private, max-age=3600",
        "X-Robots-Tag": "noindex, nofollow",
        "Content-Disposition": `inline; filename="${encodeURIComponent(
          media.originalName,
        )}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "File missing" }, { status: 404 });
  }
}
