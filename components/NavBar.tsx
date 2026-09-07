"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { LangSwitcher } from "./LangSwitcher";
import { SignOutButton } from "./SignOutButton";
import { ChildSwitcher } from "./ChildSwitcher";

type NavLabels = {
  appName: string;
  dashboard: string;
  events: string;
  timeline: string;
  children: string;
  ai: string;
  newEvent: string;
  signOut: string;
  allKids: string;
  switcher: string;
  manage: string;
};

type ChildOption = { id: string; name: string };

export function NavBar({
  locale,
  labels,
  kids,
  activeChildId,
}: {
  locale: Locale;
  labels: NavLabels;
  kids: ChildOption[];
  activeChildId: string | null;
}) {
  const pathname = usePathname();

  const links = [
    { href: "/", label: labels.dashboard, exact: true },
    { href: "/events", label: labels.events, exact: false },
    { href: "/timeline", label: labels.timeline, exact: false },
    { href: "/children", label: labels.children, exact: false },
    { href: "/ai", label: labels.ai, exact: false },
  ];

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-black/5 bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-600 text-white">
              ✦
            </span>
            <span className="text-lg font-bold tracking-tight text-ink-900">
              {labels.appName}
            </span>
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  isActive(l.href, l.exact)
                    ? "bg-brand-100 text-brand-700"
                    : "text-ink-700 hover:bg-black/5"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ChildSwitcher
            kids={kids}
            activeId={activeChildId}
            labels={{
              allKids: labels.allKids,
              switcher: labels.switcher,
              manage: labels.manage,
            }}
          />
          <Link href="/events/new" className="btn-primary hidden sm:inline-flex">
            + {labels.newEvent}
          </Link>
          <LangSwitcher locale={locale} />
          <SignOutButton label={labels.signOut} />
        </div>
      </div>
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-black/5 px-4 py-2 lg:hidden">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              isActive(l.href, l.exact)
                ? "bg-brand-100 text-brand-700"
                : "text-ink-700 hover:bg-black/5"
            }`}
          >
            {l.label}
          </Link>
        ))}
        <Link
          href="/events/new"
          className="ml-auto rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white"
        >
          +
        </Link>
      </nav>
    </header>
  );
}
