import type { EventType, EventStatus } from "@prisma/client";

export const EVENT_TYPES: EventType[] = [
  "PHOTO",
  "PRIZE",
  "COMPETITION",
  "SCHEDULE",
  "MILESTONE",
  "OTHER",
];

export const EVENT_STATUSES: EventStatus[] = ["PLANNED", "COMPLETED"];

export const CATEGORIES = [
  "academic",
  "language",
  "sports",
  "arts",
  "music",
  "leadership",
  "service",
  "family",
] as const;

export const ACCEPTED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "video/mp4",
  "application/pdf",
] as const;

export const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25MB

export const PAGE_SIZE = 9;

/** Max photos in one bulk import. Each photo becomes its own event. */
export const BULK_MAX_PHOTOS = 20;

export function isImageMime(mime: string): boolean {
  return mime.startsWith("image/");
}

export function mimeFromName(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "heic") return "image/heic";
  if (ext === "heif") return "image/heif";
  if (ext === "mp4") return "video/mp4";
  if (ext === "pdf") return "application/pdf";
  return "";
}
