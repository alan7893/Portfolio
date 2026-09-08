import { PrismaClient } from "@prisma/client";
import { generatePortfolioAnalysis } from "../lib/ai";
import { buildAiMessages } from "../lib/ai-prompt";

const prisma = new PrismaClient();

async function main() {
  const kids = await prisma.child.findMany({ include: { _count: { select: { events: true } } } });
  console.log("children", kids.map((k) => `${k.name}:${k._count.events}`).join(",") || "(none)");

  if (kids.length === 0) {
    console.log("SKIP live AI: no children in local db");
    return;
  }

  const child = await prisma.child.findFirst({
    include: {
      events: {
        orderBy: { eventDate: "asc" },
        include: { eventTags: { include: { tag: true } } },
      },
    },
  });
  if (!child) return;

  const summary = {
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
      organiser: e.organiser,
      officialName: e.officialName,
      role: e.role,
      childReflection: e.childReflection,
      nameOnEvidence: e.nameOnEvidence,
      photoPurpose: e.photoPurpose,
      status: e.status,
      tags: e.eventTags.map((et) => et.tag.name),
    })),
  };

  const prompt = buildAiMessages(summary, "p1", "zh-HK");
  console.log("prompt_user_chars", prompt.user.length);

  if (!process.env.DEEPSEEK_API_KEY) {
    console.log("SKIP live AI: no DEEPSEEK_API_KEY");
    return;
  }

  const result = await generatePortfolioAnalysis({
    provider: "deepseek",
    kind: "p1",
    locale: "zh-HK",
    child: summary,
  });
  console.log("provider", result.provider, "model", result.modelHint);
  console.log("text_preview", result.text.slice(0, 240).replace(/\s+/g, " "));
}

main()
  .catch((e) => {
    console.error("AI_TEST_FAIL", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
