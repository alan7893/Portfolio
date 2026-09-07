import { getI18n } from "@/lib/i18n.server";
import { prisma } from "@/lib/prisma";
import { getActiveChildId } from "@/lib/child.server";
import { availableProviders } from "@/lib/ai";
import { AiAnalysisPanel } from "@/components/AiAnalysisPanel";

export const dynamic = "force-dynamic";

export default async function AiPage() {
  const { locale, t } = await getI18n();
  const [kids, activeId] = await Promise.all([
    prisma.child.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { events: true } } },
    }),
    getActiveChildId(),
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
        }))}
        defaultChildId={activeId}
        providers={availableProviders()}
        locale={locale}
        t={t}
      />
    </div>
  );
}
