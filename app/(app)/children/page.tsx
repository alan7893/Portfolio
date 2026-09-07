import Link from "next/link";
import { getI18n } from "@/lib/i18n.server";
import { interpolate } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";
import { DeleteEventButton } from "@/components/DeleteEventButton";
import { deleteChildAction } from "@/app/actions/children";

export const dynamic = "force-dynamic";

export default async function ChildrenPage() {
  const { locale, t } = await getI18n();
  const children = await prisma.child.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { events: true } } },
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">{t.children.title}</h1>
          <p className="text-sm text-ink-700/70">{t.children.subtitle}</p>
        </div>
        <Link href="/children/new" className="btn-primary">
          + {t.children.addChild}
        </Link>
      </div>

      {children.length === 0 ? (
        <EmptyState
          title={t.children.empty}
          cta={t.children.addChild}
          href="/children/new"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {children.map((c) => {
            const boundDelete = deleteChildAction.bind(null, c.id);
            return (
              <div key={c.id} className="card flex flex-col gap-3 p-5">
                <div>
                  <h2 className="text-lg font-semibold text-ink-900">{c.name}</h2>
                  <p className="text-sm text-ink-700/70">
                    {formatDate(c.birthDate, locale, t)}
                    {c.school ? ` · ${c.school}` : ""}
                  </p>
                </div>
                {c.notes && (
                  <p className="line-clamp-2 text-sm text-ink-700/70">{c.notes}</p>
                )}
                <p className="text-xs font-medium text-brand-700">
                  {interpolate(t.children.eventCount, { count: c._count.events })}
                </p>
                <div className="mt-auto flex items-center gap-2 pt-2">
                  <Link href={`/children/${c.id}/edit`} className="btn-ghost">
                    {t.common.edit}
                  </Link>
                  <DeleteEventButton
                    action={boundDelete}
                    labels={{
                      delete: t.common.delete,
                      cancel: t.common.cancel,
                      confirmTitle: t.children.deleteConfirmTitle,
                      confirmBody: t.children.deleteConfirmBody,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
