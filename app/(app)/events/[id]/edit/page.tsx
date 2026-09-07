import { notFound } from "next/navigation";
import { getI18n } from "@/lib/i18n.server";
import { prisma } from "@/lib/prisma";
import { EventForm } from "@/components/EventForm";
import { updateEventAction } from "@/app/actions/events";

export const dynamic = "force-dynamic";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { t } = await getI18n();

  const [event, children] = await Promise.all([
    prisma.event.findUnique({
      where: { id },
      include: { eventTags: { include: { tag: true } } },
    }),
    prisma.child.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!event) notFound();

  const boundAction = updateEventAction.bind(null, event.id);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-2xl font-bold text-ink-900">{t.events.editEvent}</h1>
      <div className="card p-6">
        <EventForm
          action={boundAction}
          childOptions={children.map((c) => ({ value: c.id, label: c.name }))}
          t={t}
          cancelHref={`/events/${event.id}`}
          defaults={{
            childId: event.childId,
            eventType: event.eventType,
            title: event.title,
            description: event.description ?? "",
            eventDate: event.eventDate.toISOString().slice(0, 10),
            category: event.category ?? "",
            location: event.location ?? "",
            achievementRank: event.achievementRank ?? "",
            status: event.status,
            tags: event.eventTags.map((et) => et.tag.name).join(", "),
          }}
        />
      </div>
    </div>
  );
}
