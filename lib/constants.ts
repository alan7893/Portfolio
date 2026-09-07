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
  "sports",
  "arts",
  "leadership",
  "family",
] as const;

export const ACCEPTED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "application/pdf",
] as const;

export const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25MB

export const PAGE_SIZE = 9;

export function isImageMime(mime: string): boolean {
  return mime.startsWith("image/");
}
