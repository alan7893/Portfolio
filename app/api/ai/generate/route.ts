import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { aiGenerateSchema } from "@/lib/validation";
import { availableProviders, generatePortfolioAnalysis, AiError } from "@/lib/ai";
import { normalizeAiKind, stageAtDate } from "@/lib/hk-portfolio";
import { getPrivacySettings } from "@/lib/privacy.server";
import { displayChildName, redactName } from "@/lib/privacy";
import { checkRateLimit, registerFailedAttempt } from "@/lib/rateLimit";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ providers: availableProviders() });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id ?? "anon";
  const limit = checkRateLimit(`ai:${userId}`);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests", retryAfterSeconds: limit.retryAfterSeconds },
      { status: 429 },
    );
  }

  const parsed = aiGenerateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const privacy = await getPrivacySettings();
  if (!privacy.aiGenerateEnabled) {
    return NextResponse.json(
      { error: "AI drafts are turned off in privacy settings. Records stay on this server." },
      { status: 403 },
    );
  }
  if (parsed.data.provider === "deepseek" && !privacy.aiAllowDeepseek) {
    return NextResponse.json(
      { error: "DeepSeek is turned off because its terms may allow training on prompts. Use Gemini, or enable DeepSeek in Privacy." },
      { status: 403 },
    );
  }

  const providers = availableProviders();
  if (!providers[parsed.data.provider]) {
    return NextResponse.json(
      {
        error: `${parsed.data.provider === "gemini" ? "Gemini" : "DeepSeek"} API key is not configured.`,
      },
      { status: 501 },
    );
  }

  const child = await prisma.child.findUnique({
    where: { id: parsed.data.childId },
    include: {
      events: {
        orderBy: { eventDate: "asc" },
        include: { eventTags: { include: { tag: true } } },
      },
    },
  });
  if (!child) {
    return NextResponse.json({ error: "Child not found" }, { status: 404 });
  }

  const locale: Locale = parsed.data.locale ?? DEFAULT_LOCALE;
  const publicName = displayChildName(child.name, privacy.aiShareChildName, locale);

  const mapText = (value: string | null) =>
    value && !privacy.aiShareChildName ? redactName(value, child.name, locale) : value;

  try {
    const result = await generatePortfolioAnalysis({
      provider: parsed.data.provider,
      kind: normalizeAiKind(parsed.data.kind),
      locale,
      child: {
        name: publicName,
        birthDate: child.birthDate.toISOString().slice(0, 10),
        school: child.school,
        notes: mapText(child.notes),
        events: child.events.map((e) => ({
          title: mapText(e.title) ?? e.title,
          eventType: e.eventType,
          eventDate: e.eventDate.toISOString().slice(0, 10),
          description: mapText(e.description),
          category: e.category,
          location: mapText(e.location),
          achievementRank: e.achievementRank,
          organiser: e.organiser,
          officialName: e.officialName,
          role: e.role,
          childReflection: mapText(e.childReflection),
          nameOnEvidence: e.nameOnEvidence,
          photoPurpose: e.photoPurpose,
          lifeStage: stageAtDate(child.birthDate, e.eventDate),
          status: e.status,
          tags: e.eventTags.map((et) => et.tag.name),
        })),
      },
    });
    return NextResponse.json(result);
  } catch (err) {
    registerFailedAttempt(`ai:${userId}`);
    if (err instanceof AiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "AI request failed" }, { status: 502 });
  }
}
