import Link from "next/link";
import { notFound } from "next/navigation";
import { getI18n } from "@/lib/i18n.server";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { TypeBadge, StatusBadge } from "@/components/TypeBadge";
import { MediaGallery } from "@/components/MediaGallery";
import { DeleteEventButton } from "@/components/DeleteEventButton";
import { EvidenceStatus } from "@/components/CaptureChecklist";
import { wuYuForCategory } from "@/lib/hk-portfolio";
import { deleteEventAction } from "@/app/actions/events";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { locale, t } = await getI18n();

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      child: true,
      media: { orderBy: { createdAt: "asc" } },
      eventTags: { include: { tag: true } },
    },
  });

  if (!event) notFound();

  const categoryLabel = event.category
    ? (t.categories as Record<string, string>)[event.category] ?? event.category
    : null;
  const boundDelete = deleteEventAction.bind(null, event.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/events"
        className="inline-flex items-center gap-1 text-sm text-ink-700/70 hover:text-ink-900"
      >
        ← {t.common.back}
      </Link>

      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <TypeBadge
                type={event.eventType}
                label={t.eventTypes[event.eventType]}
              />
              <StatusBadge
                status={event.status}
                label={t.statuses[event.status]}
              />
              <span className="text-sm text-ink-700/60">
                {formatDate(event.eventDate, locale, t)}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-ink-900">{event.title}</h1>
            <p className="text-sm text-ink-700/70">
              {event.child.name}
              {event.location ? ` · ${event.location}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/events/${event.id}/edit`} className="btn-ghost">
              {t.common.edit}
            </Link>
            <DeleteEventButton
              action={boundDelete}
              labels={{
                delete: t.common.delete,
                cancel: t.common.cancel,
                confirmTitle: t.events.deleteConfirmTitle,
                confirmBody: t.events.deleteConfirmBody,
              }}
            />
          </div>
        </div>

        {event.achievementRank && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-amber-800">
            🏅 <span className="font-medium">{event.achievementRank}</span>
          </div>
        )}

        {(event.officialName ||
          event.organiser ||
          event.role ||
          event.photoPurpose) && (
          <dl className="mt-4 grid gap-2 text-sm text-ink-800 sm:grid-cols-2">
            {event.officialName && (
              <>
                <dt className="text-ink-700/60">{t.events.officialName}</dt>
                <dd>{event.officialName}</dd>
              </>
            )}
            {event.organiser && (
              <>
                <dt className="text-ink-700/60">{t.events.organiser}</dt>
                <dd>{event.organiser}</dd>
              </>
            )}
            {event.role && (
              <>
                <dt className="text-ink-700/60">{t.events.role}</dt>
                <dd>{(t.roles as Record<string, string>)[event.role] ?? event.role}</dd>
              </>
            )}
            {event.photoPurpose && (
              <>
                <dt className="text-ink-700/60">{t.events.photoPurpose}</dt>
                <dd>
                  {(t.photoPurposes as Record<string, string>)[event.photoPurpose] ??
                    event.photoPurpose}
                </dd>
              </>
            )}
          </dl>
        )}

        {event.childReflection && (
          <p className="mt-4 rounded-xl bg-brand-50 px-3 py-2 text-sm text-ink-800">
            <span className="font-medium">{t.events.childReflection}：</span>
            {event.childReflection}
          </p>
        )}

        {event.description && (
          <p className="mt-4 whitespace-pre-wrap text-ink-800">
            {event.description}
          </p>
        )}

        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-700/50">
            {t.events.evidenceTitle}
          </p>
          <EvidenceStatus
            t={t}
            values={{
              eventType: event.eventType,
              photoPurpose: event.photoPurpose,
              officialName: event.officialName,
              organiser: event.organiser,
              role: event.role,
              achievementRank: event.achievementRank,
              nameOnEvidence: event.nameOnEvidence,
              childReflection: event.childReflection,
              category: event.category,
              hasMedia: event.media.length > 0,
              description: event.description,
            }}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {categoryLabel && (
            <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-xs text-ink-700">
              {categoryLabel}
            </span>
          )}
          {wuYuForCategory(event.category).map((pillar) => (
            <span
              key={pillar}
              className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs text-emerald-800"
            >
              {t.events.wuYu} · {t.wuYu[pillar]}
            </span>
          ))}
          {event.eventTags.map((et) => (
            <span
              key={et.tagId}
              className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs text-brand-700"
            >
              #{et.tag.name}
            </span>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="mb-4 text-lg font-semibold text-ink-900">
          {t.events.gallery}
        </h2>
        <MediaGallery
          items={event.media.map((m) => ({
            id: m.id,
            fileType: m.fileType,
            originalName: m.originalName,
          }))}
          emptyLabel={t.common.noData}
        />
      </div>
    </div>
  );
}
