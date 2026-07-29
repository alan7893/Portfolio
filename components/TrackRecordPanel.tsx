"use client";

import { FormEvent, useState } from "react";
import type { Person, TrackRecord } from "@/lib/types";

type Props = {
  person: Person;
  records: TrackRecord[];
  onAdd: (input: Omit<TrackRecord, "id" | "personId" | "createdAt">) => void;
  onDelete: (id: string) => void;
  busy: boolean;
};

const CATEGORIES: TrackRecord["category"][] = [
  "work",
  "growth",
  "relationship",
  "milestone",
  "other",
];

export function TrackRecordPanel({ person, records, onAdd, onDelete, busy }: Props) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState<TrackRecord["category"]>("growth");
  const [notes, setNotes] = useState("");
  const [highlight, setHighlight] = useState(4);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onAdd({ title, date, category, notes, highlight });
    setTitle("");
    setNotes("");
    setHighlight(4);
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <form onSubmit={handleSubmit} className="panel rounded-[1.75rem] p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-foam/45">Track record</p>
        <h2 className="font-display mt-2 text-3xl text-foam">Log {person.name}&apos;s story</h2>
        <p className="mt-3 text-foam/65">
          Capture wins, habits, and turning points. Higher sparkle scores rise into sparkling hours.
        </p>

        <div className="mt-6 grid gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What happened?"
            required
            className="rounded-xl border border-[var(--line)] bg-ink/40 px-3 py-2.5 outline-none ring-sea/40 focus:ring-2"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="rounded-xl border border-[var(--line)] bg-ink/40 px-3 py-2.5 outline-none ring-sea/40 focus:ring-2"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TrackRecord["category"])}
              className="rounded-xl border border-[var(--line)] bg-ink/40 px-3 py-2.5 outline-none ring-sea/40 focus:ring-2"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes, context, positive observations…"
            rows={5}
            className="resize-y rounded-xl border border-[var(--line)] bg-ink/40 px-3 py-2.5 outline-none ring-sea/40 focus:ring-2"
          />
          <label className="text-sm text-foam/70">
            Sparkle intensity: {highlight}/5
            <input
              type="range"
              min={1}
              max={5}
              value={highlight}
              onChange={(e) => setHighlight(Number(e.target.value))}
              className="mt-2 w-full accent-[var(--ember)]"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="mt-2 rounded-full bg-ember px-5 py-3 text-sm font-medium text-ink hover:bg-ember-soft disabled:opacity-60"
          >
            {busy ? "Saving…" : "Add to track record"}
          </button>
        </div>
      </form>

      <div className="panel rounded-[1.75rem] p-5 sm:p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-foam/45">Timeline</p>
        <div className="mt-4 space-y-3">
          {records.length === 0 ? (
            <p className="text-sm text-foam/50">No track records yet.</p>
          ) : (
            records.map((record) => (
              <article
                key={record.id}
                className="rounded-2xl border border-[var(--line)] bg-ink/25 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium text-foam">{record.title}</h3>
                    <p className="mt-1 text-xs text-foam/45">
                      {record.date} · {record.category} · sparkle {record.highlight}/5
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDelete(record.id)}
                    className="text-xs text-foam/35 hover:text-ember"
                  >
                    Remove
                  </button>
                </div>
                {record.notes ? <p className="mt-2 text-sm text-foam/70">{record.notes}</p> : null}
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
