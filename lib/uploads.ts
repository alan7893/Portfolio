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

const SAFE_SEGMENT = /^[a-zA-Z0-9_-]+$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type UploadFile = {
  name: string;
  type: string;
  size: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

export type SavedFile = {
  filePath: string; // relative to uploadRoot, e.g. childId/eventId/uuid.jpg
  fileType: string;
  originalName: string;
  sizeBytes: number;
};

export type StagedFileMeta = {
  id: string;
  originalName: string;
  fileType: string;
  sizeBytes: number;
  ext: string;
};

export function isSafeId(id: string): boolean {
  return UUID_RE.test(id);
}

export function sanitizeUserDir(userId: string): string {
  const cleaned = userId.replace(/[^a-zA-Z0-9_-]/g, "") || "anon";
  return cleaned.slice(0, 80);
}

function safeSegment(value: string, label: string): string {
  if (!SAFE_SEGMENT.test(value)) {
    throw new Error(`Invalid ${label}`);
  }
  return value;
}

function stagingDir(userId: string): string {
  return path.join(uploadRoot(), "_staging", sanitizeUserDir(userId));
}

export function validateFile(file: UploadFile): string | null {
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
export function collectUploadedFiles(
  formData: FormData,
  field = "files",
): UploadFile[] {
  const out: UploadFile[] = [];
  for (const entry of formData.getAll(field)) {
    if (typeof entry === "string") continue;
    const blob = entry as Blob & { name?: string; type?: string; size?: number };
    if (!blob || typeof blob.arrayBuffer !== "function") continue;
    const size = typeof blob.size === "number" ? blob.size : 0;
    if (!size) continue;
    const name = blob.name || "upload";
    const type = blob.type || mimeFromName(name);
    out.push({
      name,
      type,
      size,
      arrayBuffer: () => blob.arrayBuffer(),
    });
  }
  return out;
}

export function collectStagedIds(formData: FormData): string[] {
  const ids: string[] = [];
  for (const entry of formData.getAll("staged")) {
    if (typeof entry !== "string") continue;
    const id = entry.trim();
    if (isSafeId(id) && !ids.includes(id)) ids.push(id);
  }
  return ids;
}

export function filenameStem(name: string): string {
  return name.replace(/\.[^.]+$/, "").trim();
}

export async function saveUploadedFile(
  file: UploadFile,
  childId: string,
  eventId: string,
): Promise<SavedFile> {
  const child = safeSegment(childId, "child");
  const event = safeSegment(eventId, "event");
  const dir = path.join(uploadRoot(), child, event);
  await fs.mkdir(dir, { recursive: true });

  const ext =
    EXT_BY_MIME[file.type || mimeFromName(file.name)] ||
    path.extname(file.name) ||
    ".bin";
  const id = crypto.randomUUID();
  const filename = `${id}${ext}`;
  const absPath = path.join(dir, filename);

  const bytes = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(absPath, bytes);

  return {
    filePath: path.join(child, event, filename),
    fileType: file.type || mimeFromName(file.name),
    originalName: file.name,
    sizeBytes: bytes.length,
  };
}

export async function stageUploadedFile(
  file: UploadFile,
  userId: string,
): Promise<StagedFileMeta> {
  const err = validateFile(file);
  if (err) {
    throw new Error(err);
  }

  const dir = stagingDir(userId);
  await fs.mkdir(dir, { recursive: true });

  const type = file.type || mimeFromName(file.name);
  const ext = EXT_BY_MIME[type] || path.extname(file.name) || ".bin";
  const id = crypto.randomUUID();
  const bytes = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(dir, `${id}${ext}`), bytes);

  const meta: StagedFileMeta = {
    id,
    originalName: file.name || "upload",
    fileType: type,
    sizeBytes: bytes.length,
    ext,
  };
  await fs.writeFile(path.join(dir, `${id}.json`), JSON.stringify(meta));
  return meta;
}

export async function readStagedFile(
  userId: string,
  id: string,
): Promise<StagedFileMeta | null> {
  if (!isSafeId(id)) return null;
  try {
    const raw = await fs.readFile(path.join(stagingDir(userId), `${id}.json`), "utf8");
    const meta = JSON.parse(raw) as StagedFileMeta;
    if (meta.id !== id || !isSafeId(meta.id)) return null;
    if (!meta.ext || meta.ext.includes("..") || meta.ext.includes("/") || meta.ext.includes("\\")) {
      return null;
    }
    return meta;
  } catch {
    return null;
  }
}

export async function attachStagedFiles(
  ids: string[],
  userId: string,
  childId: string,
  eventId: string,
): Promise<SavedFile[]> {
  const child = safeSegment(childId, "child");
  const event = safeSegment(eventId, "event");
  const destDir = path.join(uploadRoot(), child, event);
  await fs.mkdir(destDir, { recursive: true });

  const out: SavedFile[] = [];
  for (const id of ids) {
    const meta = await readStagedFile(userId, id);
    if (!meta) continue;
    const src = path.join(stagingDir(userId), `${id}${meta.ext}`);
    const destName = `${id}${meta.ext}`;
    const dest = path.join(destDir, destName);
    try {
      await fs.rename(src, dest);
    } catch {
      await fs.copyFile(src, dest);
      await fs.rm(src, { force: true });
    }
    await fs.rm(path.join(stagingDir(userId), `${id}.json`), { force: true });
    out.push({
      filePath: path.join(child, event, destName),
      fileType: meta.fileType,
      originalName: meta.originalName,
      sizeBytes: meta.sizeBytes,
    });
  }
  return out;
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

export function mediaWriteErrorMessage(err: unknown): string {
  const code =
    err && typeof err === "object" && "code" in err
      ? String((err as { code?: string }).code)
      : "";
  if (code === "EACCES" || code === "EPERM" || code === "EROFS") {
    return "Could not write the photo on the server. Please try again.";
  }
  if (err instanceof Error && err.message) return err.message;
  return "Could not save the photo.";
}
