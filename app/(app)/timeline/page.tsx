import Link from "next/link";
import { getI18n } from "@/lib/i18n.server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { formatDate, monthLabel } from "@/lib/format";
import { TypeBadge, StatusBadge } from "@/components/TypeBadge";
import { TimelineTabs } from "@/components/TimelineTabs";

export const dynamic = "force-dynamic";

const TAB_FILTERS: Record<string, Prisma.EventWhereInput> = {
  all: {},
  photos: { eventType: "PHOTO" },
  prizes: { eventType: "PRIZE" },
  competitions: { eventType: "COMPETITION" },
  milestones: { eventType: "MILESTONE" },
  upcoming: { status: "PLANNED" },
};

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { locale, t } = await getI18n();
  const sp = await searchParams;
  const tab = sp.tab && sp.tab in TAB_FILTERS ? sp.tab : "all";

  const events = await prisma.event.findMany({
    where: TAB_FILTERS[tab],
    include: { media: true, child: true },
    orderBy: { eventDate: "desc" },
  });

  // Group by year -> month
  const groups = new Map<
    number,
    Map<number, typeof events>
  >();
  for (const e of events) {
    const y = e.eventDate.getFullYear();
    const m = e.eventDate.getMonth();
    if (!groups.has(y)) groups.set(y, new Map());
    const months = groups.get(y)!;
    if (!months.has(m)) months.set(m, []);
    months.get(m)!.push(e);
  }
  const years = Array.from(groups.keys()).sort((a, b) => b - a);

  const tabs = [
    { key: "all", label: t.timeline.tabs.all },
    { key: "photos", label: t.timeline.tabs.photos },
    { key: "prizes", label: t.timeline.tabs.prizes },
    { key: "competitions", label: t.timeline.tabs.competitions },
    { key: "milestones", label: t.timeline.tabs.milestones },
    { key: "upcoming", label: t.timeline.tabs.upcoming },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">{t.timeline.title}</h1>
        <p className="text-sm text-ink-700/70">{t.timeline.subtitle}</p>
      </div>

      <TimelineTabs tabs={tabs} active={tab} />

      {events.length === 0 ? (
        <div className="card p-10 text-center text-ink-700/70">
          {t.timeline.empty}
        </div>
      ) : (
        <div className="space-y-10">
          {years.map((year) => {
            const months = groups.get(year)!;
            const monthKeys = Array.from(months.keys()).sort((a, b) => b - a);
            return (
              <section key={year} className="space-y-5">
                <h2 className="sticky top-16 z-10 w-fit rounded-full bg-ink-900 px-4 py-1 text-sm font-bold text-white">
                  {year}
                </h2>
                {monthKeys.map((month) => (
                  <div key={month} className="space-y-3">
                    <h3 className="text-sm font-semibold text-ink-700/70">
                      {monthLabel(month, locale, t)}
                    </h3>
                    <ol className="relative space-y-4 border-l-2 border-brand-200 pl-5">
                      {months.get(month)!.map((e) => {
                        const firstImage = e.media.find((m) =>
                          m.fileType.startsWith("image/"),
                        );
                        return (
                          <li key={e.id} className="relative">
                            <span className="absolute -left-[26px] top-3 h-3 w-3 rounded-full border-2 border-white bg-brand-500" />
                            <Link
                              href={`/events/${e.id}`}
                              className="card flex gap-4 p-3 transition hover:shadow-md"
                            >
                              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-brand-100 to-rose-100">
                                {firstImage ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={`/api/media/${firstImage.id}`}
                                    alt={e.title}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="grid h-full w-full place-items-center text-2xl opacity-40">
                                    ✦
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <TypeBadge
                                    type={e.eventType}
                                    label={t.eventTypes[e.eventType]}
                                  />
                                  {e.status === "PLANNED" && (
                                    <StatusBadge
                                      status={e.status}
                                      label={t.statuses[e.status]}
                                    />
                                  )}
                                  <span className="text-xs text-ink-700/60">
                                    {formatDate(e.eventDate, locale, t)}
                                  </span>
                                </div>
                                <p className="truncate font-semibold text-ink-900">
                                  {e.title}
                                </p>
                                {e.description && (
                                  <p className="line-clamp-1 text-sm text-ink-700/70">
                                    {e.description}
                                  </p>
                                )}
                              </div>
                            </Link>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                ))}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
