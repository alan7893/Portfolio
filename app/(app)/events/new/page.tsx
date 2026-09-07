import { redirect } from "next/navigation";
import { getI18n } from "@/lib/i18n.server";
import { prisma } from "@/lib/prisma";
import { EventForm } from "@/components/EventForm";
import { createEventAction } from "@/app/actions/events";

export const dynamic = "force-dynamic";

export default async function NewEventPage() {
  const { t } = await getI18n();
  const children = await prisma.child.findMany({ orderBy: { name: "asc" } });

  if (children.length === 0) {
    // No child yet — seed should create one; guard for safety.
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-2xl font-bold text-ink-900">{t.events.newEvent}</h1>
      <div className="card p-6">
        <EventForm
          action={createEventAction}
          childOptions={children.map((c) => ({ value: c.id, label: c.name }))}
          t={t}
          cancelHref="/events"
        />
      </div>
    </div>
  );
}
