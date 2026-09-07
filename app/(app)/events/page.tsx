import { interpolate } from "@/lib/i18n";
import { getI18n } from "@/lib/i18n.server";
import { prisma } from "@/lib/prisma";
import type { Prisma, EventType } from "@prisma/client";
import { PAGE_SIZE, EVENT_TYPES } from "@/lib/constants";
import { getFilterOptions, toCardData } from "@/lib/queries";
import { EventCard } from "@/components/EventCard";
import { EventFilters } from "@/components/EventFilters";
import { Pagination } from "@/components/Pagination";
import { EmptyState } from "@/components/EmptyState";
import Link from "next/link";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  child?: string;
  type?: string;
  year?: string;
  tag?: string;
  page?: string;
}>;

export default async function EventsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { locale, t } = await getI18n();
  const sp = await searchParams;

  const page = Math.max(1, Number(sp.page) || 1);
  const where: Prisma.EventWhereInput = {};
  if (sp.child) where.childId = sp.child;
  if (sp.type && (EVENT_TYPES as string[]).includes(sp.type)) {
    where.eventType = sp.type as EventType;
  }
  if (sp.year) {
    const y = Number(sp.year);
    where.eventDate = {
      gte: new Date(y, 0, 1),
      lt: new Date(y + 1, 0, 1),
    };
  }
  if (sp.tag) {
    where.eventTags = { some: { tag: { name: sp.tag } } };
  }

  const [total, events, options] = await Promise.all([
    prisma.event.count({ where }),
    prisma.event.findMany({
      where,
      include: { media: true, eventTags: { include: { tag: true } } },
      orderBy: { eventDate: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    getFilterOptions(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">
            {t.events.listTitle}
          </h1>
          <p className="text-sm text-ink-700/70">
            {interpolate(t.events.resultsCount, { count: total })}
          </p>
        </div>
        <Link href="/events/new" className="btn-primary">
          + {t.events.newEvent}
        </Link>
      </div>

      <EventFilters
        labels={{
          child: t.events.child,
          type: t.events.type,
          year: t.events.year,
          tag: t.events.tag,
          all: t.common.all,
          clear: t.common.clear,
        }}
        childOptions={options.children}
        types={EVENT_TYPES.map((tp) => ({ value: tp, label: t.eventTypes[tp] }))}
        years={options.years}
        tags={options.tags}
      />

      {events.length === 0 ? (
        <EmptyState
          title={t.events.noEvents}
          cta={t.events.newEvent}
          href="/events/new"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => (
            <EventCard
              key={e.id}
              event={toCardData(e)}
              locale={locale}
              t={t}
            />
          ))}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        baseQuery={{
          child: sp.child,
          type: sp.type,
          year: sp.year,
          tag: sp.tag,
        }}
        labels={{ prev: t.events.prev, next: t.events.next, pageOf: t.events.pageOf }}
      />
    </div>
  );
}
