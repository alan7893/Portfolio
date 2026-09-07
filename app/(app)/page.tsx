import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getI18n } from "@/lib/i18n.server";
import { StatCard } from "@/components/StatCard";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const { locale, t } = await getI18n();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [total, thisMonth, upcoming, latestPhotos] = await Promise.all([
    prisma.event.count(),
    prisma.event.count({
      where: { eventDate: { gte: monthStart, lt: monthEnd } },
    }),
    prisma.event.count({ where: { status: "PLANNED" } }),
    prisma.media.findMany({
      where: { fileType: { startsWith: "image/" } },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { event: true },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">
            {t.dashboard.title}
          </h1>
          <p className="text-sm text-ink-700/70">
            {t.dashboard.welcome}
            {session?.user?.name ? `，${session.user.name}` : ""} ✦
          </p>
        </div>
        <Link href="/events/new" className="btn-primary">
          + {t.events.newEvent}
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label={t.dashboard.totalEvents} value={total} accent="brand" />
        <StatCard
          label={t.dashboard.eventsThisMonth}
          value={thisMonth}
          accent="sky"
        />
        <StatCard
          label={t.dashboard.upcoming}
          value={upcoming}
          accent="emerald"
        />
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink-900">
            {t.dashboard.latestPhotos}
          </h2>
          <Link
            href="/timeline?tab=photos"
            className="text-sm font-medium text-brand-700 hover:underline"
          >
            {t.dashboard.viewAll} →
          </Link>
        </div>
        {latestPhotos.length === 0 ? (
          <div className="card p-8 text-center text-ink-700/70">
            {t.dashboard.emptyPhotos}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {latestPhotos.map((m) => (
              <Link
                key={m.id}
                href={`/events/${m.eventId}`}
                className="group relative aspect-square overflow-hidden rounded-xl border border-black/5"
                title={m.event.title}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/media/${m.id}`}
                  alt={m.originalName}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
                <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/60 to-transparent px-2 py-1 text-[11px] text-white">
                  {formatDate(m.event.eventDate, locale, t)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
