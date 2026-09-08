"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { eventInputSchema, parseTags } from "@/lib/validation";
import type { ActionState } from "@/lib/action-state";
import {
  deleteEventFiles,
  saveUploadedFile,
  validateFile,
  collectUploadedFiles,
  collectStagedIds,
  attachStagedFiles,
  readStagedFile,
  mediaWriteErrorMessage,
} from "@/lib/uploads";
import type { SavedFile } from "@/lib/uploads";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

function sessionUserId(session: { user?: { id?: string } }): string {
  return session.user?.id ?? "anon";
}

function readEventForm(formData: FormData) {
  return {
    childId: String(formData.get("childId") ?? ""),
    eventType: String(formData.get("eventType") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    eventDate: String(formData.get("eventDate") ?? ""),
    category: String(formData.get("category") ?? ""),
    location: String(formData.get("location") ?? ""),
    achievementRank: String(formData.get("achievementRank") ?? ""),
    status: String(formData.get("status") ?? "COMPLETED"),
    tags: String(formData.get("tags") ?? ""),
  };
}

async function syncTags(eventId: string, tagNames: string[]) {
  await prisma.eventTag.deleteMany({ where: { eventId } });
  for (const name of tagNames) {
    const tag = await prisma.tag.upsert({
      where: { name },
      create: { name },
      update: {},
    });
    await prisma.eventTag.create({
      data: { eventId, tagId: tag.id },
    });
  }
}

async function insertMediaRows(eventId: string, stored: SavedFile[]) {
  for (const file of stored) {
    await prisma.media.create({
      data: {
        eventId,
        filePath: file.filePath,
        fileType: file.fileType,
        originalName: file.originalName,
        sizeBytes: file.sizeBytes,
      },
    });
  }
}

function fileTypeError(err: string): string {
  return err.startsWith("tooLarge")
    ? "A photo is larger than 25MB."
    : "That photo type is not supported. Use JPEG, PNG, WebP, HEIC, MP4 or PDF.";
}

async function saveDirectUploads(
  formData: FormData,
  childId: string,
  eventId: string,
): Promise<number> {
  const files = collectUploadedFiles(formData);
  let saved = 0;
  let lastErr: string | null = null;
  for (const file of files) {
    const err = validateFile(file);
    if (err) {
      lastErr = err;
      continue;
    }
    try {
      const stored = await saveUploadedFile(file, childId, eventId);
      await insertMediaRows(eventId, [stored]);
      saved += 1;
    } catch (e) {
      console.error("[media] direct save failed", e);
      lastErr = mediaWriteErrorMessage(e);
    }
  }
  if (files.length > 0 && saved === 0) {
    throw new Error(
      lastErr?.startsWith("tooLarge") || lastErr?.startsWith("badType")
        ? fileTypeError(lastErr)
        : lastErr || "Could not save the photo.",
    );
  }
  return saved;
}

async function persistEventMedia(
  formData: FormData,
  userId: string,
  childId: string,
  eventId: string,
): Promise<void> {
  const stagedIds = collectStagedIds(formData);
  if (stagedIds.length > 0) {
    const stored = await attachStagedFiles(stagedIds, userId, childId, eventId);
    if (stored.length === 0) {
      throw new Error("Photos were not found on the server. Please choose them again.");
    }
    await insertMediaRows(eventId, stored);
    return;
  }
  await saveDirectUploads(formData, childId, eventId);
}

export async function createEventAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireSession();
  const userId = sessionUserId(session);
  const raw = readEventForm(formData);
  const parsed = eventInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const files = collectUploadedFiles(formData);
  for (const file of files) {
    const err = validateFile(file);
    if (err) {
      return { error: fileTypeError(err) };
    }
  }

  const stagedIds = collectStagedIds(formData);
  if (stagedIds.length > 0) {
    const first = await readStagedFile(userId, stagedIds[0]);
    if (!first) {
      return {
        error: "Photos were not found on the server. Please choose them again.",
      };
    }
  }

  const title = parsed.data.title || "";
  if (!title) {
    return {
      error:
        stagedIds.length || files.length
          ? "Wait for AI to read the photo, or type a title."
          : "Add a title, or upload a photo so AI can fill it.",
    };
  }

  const child = await prisma.child.findUnique({
    where: { id: parsed.data.childId },
    select: { id: true },
  });
  if (!child) {
    return { error: "Child not found. Add a child first." };
  }

  const event = await prisma.event.create({
    data: {
      childId: parsed.data.childId,
      eventType: parsed.data.eventType as never,
      title,
      description: parsed.data.description || null,
      eventDate: new Date(parsed.data.eventDate),
      category: parsed.data.category || null,
      location: parsed.data.location || null,
      achievementRank: parsed.data.achievementRank || null,
      status: parsed.data.status as never,
    },
  });

  try {
    await syncTags(event.id, parseTags(parsed.data.tags));
    await persistEventMedia(formData, userId, parsed.data.childId, event.id);
  } catch (e) {
    console.error("[events] create media failed", e);
    await prisma.event.delete({ where: { id: event.id } }).catch(() => {});
    await deleteEventFiles(parsed.data.childId, event.id).catch(() => {});
    return { error: mediaWriteErrorMessage(e) };
  }

  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath("/timeline");
  redirect(`/events/${event.id}`);
}

export async function updateEventAction(
  eventId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireSession();
  const userId = sessionUserId(session);
  const raw = readEventForm(formData);
  const parsed = eventInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await prisma.event.findUnique({ where: { id: eventId } });
  if (!existing) {
    return { error: "Event not found." };
  }

  const event = await prisma.event.update({
    where: { id: eventId },
    data: {
      eventType: parsed.data.eventType as never,
      title: parsed.data.title || existing.title,
      description: parsed.data.description || null,
      eventDate: new Date(parsed.data.eventDate),
      category: parsed.data.category || null,
      location: parsed.data.location || null,
      achievementRank: parsed.data.achievementRank || null,
      status: parsed.data.status as never,
    },
  });

  try {
    await syncTags(event.id, parseTags(parsed.data.tags));
    await persistEventMedia(formData, userId, event.childId, event.id);
  } catch (e) {
    console.error("[events] update media failed", e);
    return { error: mediaWriteErrorMessage(e) };
  }

  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath("/timeline");
  revalidatePath(`/events/${eventId}`);
  redirect(`/events/${eventId}`);
}

export async function deleteEventAction(eventId: string) {
  await requireSession();
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return;

  await deleteEventFiles(event.childId, event.id);
  await prisma.event.delete({ where: { id: eventId } });

  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath("/timeline");
  redirect("/events");
}

export async function deleteMediaAction(mediaId: string) {
  await requireSession();
  const media = await prisma.media.findUnique({ where: { id: mediaId } });
  if (!media) return;
  const { promises: fs } = await import("fs");
  const { resolveStoredFile } = await import("@/lib/uploads");
  const abs = resolveStoredFile(media.filePath);
  if (abs) {
    await fs.rm(abs, { force: true });
  }
  await prisma.media.delete({ where: { id: mediaId } });
  revalidatePath(`/events/${media.eventId}`);
}
