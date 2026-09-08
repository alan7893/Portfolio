import { getI18n } from "@/lib/i18n.server";
import { prisma } from "@/lib/prisma";
import { getActiveChildId } from "@/lib/child.server";
import { availableProviders } from "@/lib/ai";
import { AiAnalysisPanel } from "@/components/AiAnalysisPanel";
import { getPrivacySettings } from "@/lib/privacy.server";

export const dynamic = "force-dynamic";

export default async function AiPage() {
  const { locale, t } = await getI18n();
  const [kids, activeId, privacy] = await Promise.all([
    prisma.child.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { events: true } },
        events: {
          select: {
            eventType: true,
            photoPurpose: true,
            officialName: true,
            organiser: true,
            role: true,
            achievementRank: true,
            nameOnEvidence: true,
            childReflection: true,
            category: true,
            description: true,
            _count: { select: { media: true } },
          },
        },
      },
    }),
    getActiveChildId(),
    getPrivacySettings(),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">{t.ai.title}</h1>
        <p className="text-sm text-ink-700/70">{t.ai.subtitle}</p>
      </div>
      <AiAnalysisPanel
        kids={kids.map((c) => ({
          id: c.id,
          name: c.name,
          eventCount: c._count.events,
          birthDate: c.birthDate.toISOString().slice(0, 10),
          events: c.events.map((e) => ({
            eventType: e.eventType,
            photoPurpose: e.photoPurpose,
            officialName: e.officialName,
            organiser: e.organiser,
            role: e.role,
            achievementRank: e.achievementRank,
            nameOnEvidence: e.nameOnEvidence,
            childReflection: e.childReflection,
            category: e.category,
            description: e.description,
            hasMedia: e._count.media > 0,
          })),
        }))}
        defaultChildId={activeId}
        providers={availableProviders()}
        privacy={privacy}
        locale={locale}
        t={t}
      />
    </div>
  );
}
