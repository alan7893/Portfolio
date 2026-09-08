import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getI18n } from "@/lib/i18n.server";
import { prisma } from "@/lib/prisma";
import { getActiveChildId } from "@/lib/child.server";
import { NavBar } from "@/components/NavBar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  const { locale, t } = await getI18n();
  const [kids, activeChildId] = await Promise.all([
    prisma.child.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    getActiveChildId(),
  ]);

  return (
    <div className="min-h-screen">
      <NavBar
        locale={locale}
        kids={kids}
        activeChildId={activeChildId}
        labels={{
          appName: t.appName,
          dashboard: t.nav.dashboard,
          events: t.nav.events,
          timeline: t.nav.timeline,
          children: t.nav.children,
          ai: t.nav.ai,
          guide: t.nav.guide,
          newEvent: t.nav.newEvent,
          settings: t.nav.settings,
          signOut: t.nav.signOut,
          allKids: t.children.allKids,
          switcher: t.children.switcher,
          manage: t.children.addChild,
        }}
      />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      <footer className="mx-auto max-w-6xl px-4 py-8 text-center text-xs text-ink-700/60">
        {t.appName} · lumen.greednews.com
      </footer>
    </div>
  );
}
