"use client";

import Link from "next/link";

type Tab = { key: string; label: string };

export function TimelineTabs({
  tabs,
  active,
}: {
  tabs: Tab[];
  active: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.key === "all" ? "/timeline" : `/timeline?tab=${tab.key}`}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            active === tab.key
              ? "bg-brand-600 text-white"
              : "bg-white text-ink-700 hover:bg-black/5"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
