"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { EventType } from "@prisma/client";

type Option = { value: string; label: string };

type Labels = {
  child: string;
  type: string;
  year: string;
  tag: string;
  all: string;
  clear: string;
};

export function EventFilters({
  labels,
  childOptions,
  types,
  years,
  tags,
}: {
  labels: Labels;
  childOptions: Option[];
  types: { value: EventType; label: string }[];
  years: string[];
  tags: string[];
}) {
  const router = useRouter();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    router.push(`/events?${next.toString()}`);
  }

  const hasFilters =
    params.get("child") ||
    params.get("type") ||
    params.get("year") ||
    params.get("tag");

  return (
    <div className="card flex flex-wrap items-end gap-3 p-4">
      <Field label={labels.child}>
        <select
          className="input"
          value={params.get("child") ?? ""}
          onChange={(e) => update("child", e.target.value)}
        >
          <option value="">{labels.all}</option>
          {childOptions.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label={labels.type}>
        <select
          className="input"
          value={params.get("type") ?? ""}
          onChange={(e) => update("type", e.target.value)}
        >
          <option value="">{labels.all}</option>
          {types.map((tp) => (
            <option key={tp.value} value={tp.value}>
              {tp.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label={labels.year}>
        <select
          className="input"
          value={params.get("year") ?? ""}
          onChange={(e) => update("year", e.target.value)}
        >
          <option value="">{labels.all}</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </Field>
      <Field label={labels.tag}>
        <select
          className="input"
          value={params.get("tag") ?? ""}
          onChange={(e) => update("tag", e.target.value)}
        >
          <option value="">{labels.all}</option>
          {tags.map((tg) => (
            <option key={tg} value={tg}>
              {tg}
            </option>
          ))}
        </select>
      </Field>
      {hasFilters && (
        <button
          type="button"
          className="btn-ghost"
          onClick={() => router.push("/events")}
        >
          {labels.clear}
        </button>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex min-w-[130px] flex-1 flex-col gap-1">
      <span className="text-xs font-medium text-ink-700/70">{label}</span>
      {children}
    </label>
  );
}
