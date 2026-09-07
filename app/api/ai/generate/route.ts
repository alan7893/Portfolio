import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { aiGenerateSchema } from "@/lib/validation";
import { availableProviders, generatePortfolioAnalysis, AiError } from "@/lib/ai";
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

  try {
    const result = await generatePortfolioAnalysis({
      provider: parsed.data.provider,
      kind: parsed.data.kind,
      locale,
      child: {
        name: child.name,
        birthDate: child.birthDate.toISOString().slice(0, 10),
        school: child.school,
        notes: child.notes,
        events: child.events.map((e) => ({
          title: e.title,
          eventType: e.eventType,
          eventDate: e.eventDate.toISOString().slice(0, 10),
          description: e.description,
          category: e.category,
          location: e.location,
          achievementRank: e.achievementRank,
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
