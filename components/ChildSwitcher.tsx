"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ALL_CHILDREN_VALUE } from "@/lib/child";

type ChildOption = { id: string; name: string };

export function ChildSwitcher({
  kids,
  activeId,
  labels,
}: {
  kids: ChildOption[];
  activeId: string | null;
  labels: { allKids: string; switcher: string; manage: string };
}) {
  const router = useRouter();

  async function onChange(value: string) {
    await fetch("/api/active-child", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        childId: value === ALL_CHILDREN_VALUE ? null : value,
      }),
    });
    router.refresh();
  }

  if (kids.length === 0) {
    return (
      <Link href="/children/new" className="btn-ghost hidden text-xs sm:inline-flex">
        + {labels.manage}
      </Link>
    );
  }

  return (
    <label className="hidden items-center gap-2 sm:flex">
      <span className="sr-only">{labels.switcher}</span>
      <select
        className="input max-w-[160px] py-1.5 text-sm"
        value={activeId ?? ALL_CHILDREN_VALUE}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value={ALL_CHILDREN_VALUE}>{labels.allKids}</option>
        {kids.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </label>
  );
}
