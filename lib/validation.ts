import { z } from "zod";
import { EVENT_TYPES, EVENT_STATUSES } from "@/lib/constants";

export const eventInputSchema = z.object({
  childId: z.string().uuid({ message: "childId must be a valid id" }),
  eventType: z.enum(EVENT_TYPES as [string, ...string[]]),
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  eventDate: z.string().min(1, "Date is required"),
  category: z.string().trim().max(60).optional().or(z.literal("")),
  location: z.string().trim().max(200).optional().or(z.literal("")),
  achievementRank: z.string().trim().max(120).optional().or(z.literal("")),
  status: z.enum(EVENT_STATUSES as [string, ...string[]]),
  tags: z.string().trim().max(500).optional().or(z.literal("")),
});

export type EventInput = z.infer<typeof eventInputSchema>;

export const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export function parseTags(raw: string | undefined | null): string[] {
  if (!raw) return [];
  return Array.from(
    new Set(
      raw
        .split(/[,，]/)
        .map((t) => t.trim())
        .filter(Boolean),
    ),
  ).slice(0, 20);
}
