import { getI18n } from "@/lib/i18n.server";
import { prisma } from "@/lib/prisma";
import { getActiveChildId } from "@/lib/child.server";
import { EmptyState } from "@/components/EmptyState";
import { BulkImport } from "@/components/BulkImport";
import { createBulkEventsAction } from "@/app/actions/events";
import { getPrivacySettings } from "@/lib/privacy.server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function BulkEventsPage() {
  const { t } = await getI18n();
  const [children, activeId, privacy] = await Promise.all([
    prisma.child.findMany({ orderBy: { name: "asc" } }),
    getActiveChildId(),
    getPrivacySettings(),
  ]);

  if (children.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <h1 className="text-2xl font-bold text-ink-900">{t.events.bulkTitle}</h1>
        <EmptyState
          title={t.events.needChild}
          cta={t.children.addChild}
          href="/children/new"
        />
      </div>
    );
  }

  const defaultChildId =
    activeId && children.some((c) => c.id === activeId)
      ? activeId
      : children[0].id;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">{t.events.bulkTitle}</h1>
        <p className="mt-2 text-sm text-ink-700/70">{t.events.bulkSubtitle}</p>
        <p className="mt-2 text-sm text-ink-700/60">
          {t.events.bulkVsSingle}{" "}
          <Link href="/events/new" className="text-brand-700 hover:underline">
            {t.events.bulkVsSingleLink}
          </Link>
        </p>
      </div>
      <div className="card p-6">
        <BulkImport
          action={createBulkEventsAction}
          childOptions={children.map((c) => ({ value: c.id, label: c.name }))}
          defaultChildId={defaultChildId}
          captionEnabled={privacy.aiCaptionEnabled}
          t={t}
        />
      </div>
    </div>
  );
}
