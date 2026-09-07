"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { eventInputSchema, parseTags } from "@/lib/validation";
import {
  deleteEventFiles,
  saveUploadedFile,
  validateFile,
} from "@/lib/uploads";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
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

async function saveMediaFiles(
  formData: FormData,
  childId: string,
  eventId: string,
) {
  const files = formData
    .getAll("files")
    .filter((f): f is File => f instanceof File && f.size > 0);

  for (const file of files) {
    const err = validateFile(file);
    if (err) {
      // Skip invalid files silently here; client-side validation already warns.
      continue;
    }
    const saved = await saveUploadedFile(file, childId, eventId);
    await prisma.media.create({
      data: {
        eventId,
        filePath: saved.filePath,
        fileType: saved.fileType,
        originalName: saved.originalName,
        sizeBytes: saved.sizeBytes,
      },
    });
  }
}

export async function createEventAction(formData: FormData) {
  await requireSession();
  const raw = readEventForm(formData);
  const parsed = eventInputSchema.parse(raw);

  const event = await prisma.event.create({
    data: {
      childId: parsed.childId,
      eventType: parsed.eventType as never,
      title: parsed.title,
      description: parsed.description || null,
      eventDate: new Date(parsed.eventDate),
      category: parsed.category || null,
      location: parsed.location || null,
      achievementRank: parsed.achievementRank || null,
      status: parsed.status as never,
    },
  });

  await syncTags(event.id, parseTags(parsed.tags));
  await saveMediaFiles(formData, parsed.childId, event.id);

  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath("/timeline");
  redirect(`/events/${event.id}`);
}

export async function updateEventAction(eventId: string, formData: FormData) {
  await requireSession();
  const raw = readEventForm(formData);
  const parsed = eventInputSchema.parse(raw);

  const event = await prisma.event.update({
    where: { id: eventId },
    data: {
      eventType: parsed.eventType as never,
      title: parsed.title,
      description: parsed.description || null,
      eventDate: new Date(parsed.eventDate),
      category: parsed.category || null,
      location: parsed.location || null,
      achievementRank: parsed.achievementRank || null,
      status: parsed.status as never,
    },
  });

  await syncTags(event.id, parseTags(parsed.tags));
  await saveMediaFiles(formData, event.childId, event.id);

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
