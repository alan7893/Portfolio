import { getI18n } from "@/lib/i18n.server";
import { prisma } from "@/lib/prisma";
import { getActiveChildId } from "@/lib/child.server";
import { EventForm } from "@/components/EventForm";
import { EmptyState } from "@/components/EmptyState";
import { createEventAction } from "@/app/actions/events";

export const dynamic = "force-dynamic";

export default async function NewEventPage() {
  const { t } = await getI18n();
  const [children, activeId] = await Promise.all([
    prisma.child.findMany({ orderBy: { name: "asc" } }),
    getActiveChildId(),
  ]);

  if (children.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <h1 className="text-2xl font-bold text-ink-900">{t.events.newEvent}</h1>
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
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-2xl font-bold text-ink-900">{t.events.newEvent}</h1>
      <div className="card p-6">
        <EventForm
          action={createEventAction}
          childOptions={children.map((c) => ({ value: c.id, label: c.name }))}
          defaults={{ childId: defaultChildId }}
          t={t}
          cancelHref="/events"
        />
      </div>
    </div>
  );
}
