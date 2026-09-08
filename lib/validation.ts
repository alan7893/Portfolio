import { z } from "zod";
import { EVENT_TYPES, EVENT_STATUSES } from "@/lib/constants";
import { PHOTO_PURPOSES, PARTICIPATION_ROLES } from "@/lib/hk-portfolio";

export const eventInputSchema = z.object({
  childId: z.string().uuid({ message: "childId must be a valid id" }),
  eventType: z.enum(EVENT_TYPES as [string, ...string[]]),
  title: z.string().trim().max(200).optional().or(z.literal("")),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  eventDate: z.string().min(1, "Date is required"),
  category: z.string().trim().max(60).optional().or(z.literal("")),
  location: z.string().trim().max(200).optional().or(z.literal("")),
  achievementRank: z.string().trim().max(120).optional().or(z.literal("")),
  organiser: z.string().trim().max(160).optional().or(z.literal("")),
  officialName: z.string().trim().max(200).optional().or(z.literal("")),
  role: z.string().trim().max(40).optional().or(z.literal("")),
  childReflection: z.string().trim().max(1000).optional().or(z.literal("")),
  nameOnEvidence: z.enum(["true", "false", "on", ""]).optional(),
  photoPurpose: z.string().trim().max(40).optional().or(z.literal("")),
  status: z.enum(EVENT_STATUSES as [string, ...string[]]),
  tags: z.string().trim().max(500).optional().or(z.literal("")),
});

export type EventInput = z.infer<typeof eventInputSchema>;

export const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const childInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  birthDate: z.string().min(1, "Birth date is required"),
  school: z.string().trim().max(120).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type ChildInput = z.infer<typeof childInputSchema>;

export const aiGenerateSchema = z.object({
  childId: z.string().uuid(),
  provider: z.enum(["gemini", "deepseek"]),
  kind: z.enum([
    "kinder",
    "p1",
    "s1",
    "jupas",
    "cv",
    "portfolio",
    "testimonial",
    "memory",
  ]),
  locale: z.enum(["zh-HK", "en"]).optional(),
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

export function parseNameOnEvidence(raw: string | undefined | null): boolean {
  return raw === "true" || raw === "on" || raw === "1";
}

export function parsePhotoPurpose(raw: string | undefined | null): string | null {
  const value = (raw ?? "").trim();
  return (PHOTO_PURPOSES as readonly string[]).includes(value) ? value : null;
}

export function parseParticipationRole(raw: string | undefined | null): string | null {
  const value = (raw ?? "").trim();
  return (PARTICIPATION_ROLES as readonly string[]).includes(value) ? value : null;
}
