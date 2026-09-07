import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getI18n } from "@/lib/i18n.server";
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

  return (
    <div className="min-h-screen">
      <NavBar
        locale={locale}
        labels={{
          appName: t.appName,
          dashboard: t.nav.dashboard,
          events: t.nav.events,
          timeline: t.nav.timeline,
          newEvent: t.nav.newEvent,
          signOut: t.nav.signOut,
        }}
      />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      <footer className="mx-auto max-w-6xl px-4 py-8 text-center text-xs text-ink-700/60">
        {t.appName} · portfolio.greednews.com
      </footer>
    </div>
  );
}
