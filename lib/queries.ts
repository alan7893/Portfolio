import { prisma } from "@/lib/prisma";
import type { EventCardData } from "@/components/EventCard";
import type { Prisma } from "@prisma/client";

type EventWithMedia = Prisma.EventGetPayload<{
  include: { media: true; child: true; eventTags: { include: { tag: true } } };
}>;

export function toCardData(event: EventWithMedia): EventCardData {
  const firstImage = event.media.find((m) => m.fileType.startsWith("image/"));
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    eventType: event.eventType,
    status: event.status,
    eventDate: event.eventDate,
    category: event.category,
    achievementRank: event.achievementRank,
    firstImageMediaId: firstImage?.id ?? null,
    mediaCount: event.media.length,
    childName: event.child.name,
  };
}

export async function getFilterOptions() {
  const [children, tags, years] = await Promise.all([
    prisma.child.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
    prisma.event.findMany({ select: { eventDate: true } }),
  ]);

  const yearSet = new Set<string>();
  for (const e of years) {
    yearSet.add(String(e.eventDate.getFullYear()));
  }

  return {
    children: children.map((c) => ({ value: c.id, label: c.name })),
    tags: tags.map((t) => t.name),
    years: Array.from(yearSet).sort((a, b) => Number(b) - Number(a)),
  };
}
