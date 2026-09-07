import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { ACCEPTED_MIME, MAX_FILE_BYTES, mimeFromName } from "@/lib/constants";

/** Absolute base directory for uploaded files. */
export function uploadRoot(): string {
  const configured = process.env.UPLOAD_DIR || "./uploads";
  return path.isAbsolute(configured)
    ? configured
    : path.join(process.cwd(), configured);
}

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/heic": ".heic",
  "image/heif": ".heif",
  "video/mp4": ".mp4",
  "application/pdf": ".pdf",
};

export type SavedFile = {
  filePath: string; // relative to uploadRoot, e.g. childId/eventId/uuid.jpg
  fileType: string;
  originalName: string;
  sizeBytes: number;
};

export function validateFile(file: File): string | null {
  const type = file.type || mimeFromName(file.name);
  if (!ACCEPTED_MIME.includes(type as (typeof ACCEPTED_MIME)[number])) {
    return `badType:${file.name}`;
  }
  if (file.size > MAX_FILE_BYTES) {
    return `tooLarge:${file.name}`;
  }
  return null;
}

/** Pull real uploads out of FormData. `instanceof File` fails in some Node runtimes. */
export function collectUploadedFiles(formData: FormData, field = "files"): File[] {
  const out: File[] = [];
  for (const entry of formData.getAll(field)) {
    if (typeof entry === "string") continue;
    const blob = entry as Blob & { name?: string; type?: string; size?: number };
    if (!blob || typeof blob.arrayBuffer !== "function") continue;
    if (!blob.size) continue;
    const name = blob.name || "upload";
    const type = blob.type || mimeFromName(name);
    const file = new File([blob], name, { type });
    out.push(file);
  }
  return out;
}

export async function saveUploadedFile(
  file: File,
  childId: string,
  eventId: string,
): Promise<SavedFile> {
  const dir = path.join(uploadRoot(), childId, eventId);
  await fs.mkdir(dir, { recursive: true });

  const ext = EXT_BY_MIME[file.type || mimeFromName(file.name)] || path.extname(file.name) || ".bin";
  const id = crypto.randomUUID();
  const filename = `${id}${ext}`;
  const absPath = path.join(dir, filename);

  const bytes = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(absPath, bytes);

  return {
    filePath: path.join(childId, eventId, filename),
    fileType: file.type || mimeFromName(file.name),
    originalName: file.name,
    sizeBytes: file.size,
  };
}

export async function deleteEventFiles(
  childId: string,
  eventId: string,
): Promise<void> {
  const dir = path.join(uploadRoot(), childId, eventId);
  await fs.rm(dir, { recursive: true, force: true });
}

export function resolveStoredFile(relativePath: string): string | null {
  const root = uploadRoot();
  const abs = path.resolve(root, relativePath);
  // Guard against path traversal — resolved path must stay under root.
  if (abs !== root && !abs.startsWith(root + path.sep)) {
    return null;
  }
  return abs;
}
