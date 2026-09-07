"use client";

import { FormEvent, useState } from "react";
import type { Person } from "@/lib/types";

type Props = {
  people: Person[];
  activePersonId: string | null;
  onCreate: (name: string, role?: string) => void;
  onSwitch: (id: string) => void;
  onDelete: (id: string) => void;
};

export function UserSwitcher({ people, activePersonId, onCreate, onSwitch, onDelete }: Props) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [open, setOpen] = useState(people.length === 0);

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name, role);
    setName("");
    setRole("");
    setOpen(false);
  }

  return (
    <section className="panel rounded-[1.5rem] p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-foam/45">People</p>
          <p className="mt-1 text-sm text-foam/70">Switch profiles to keep memories separate</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-full bg-ember px-4 py-2 text-sm font-medium text-ink transition hover:bg-ember-soft"
        >
          {open ? "Close" : "Add person"}
        </button>
      </div>

      {open ? (
        <form onSubmit={handleCreate} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="rounded-xl border border-[var(--line)] bg-ink/40 px-3 py-2.5 outline-none ring-sea/40 focus:ring-2"
            required
          />
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Role / relation (optional)"
            className="rounded-xl border border-[var(--line)] bg-ink/40 px-3 py-2.5 outline-none ring-sea/40 focus:ring-2"
          />
          <button
            type="submit"
            className="rounded-xl bg-sea px-4 py-2.5 text-sm font-medium text-ink hover:bg-sea/90"
          >
            Save
          </button>
        </form>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {people.length === 0 ? (
          <p className="text-sm text-foam/50">No people yet.</p>
        ) : (
          people.map((person) => {
            const active = person.id === activePersonId;
            return (
              <div key={person.id} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onSwitch(person.id)}
                  className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm transition ${
                    active
                      ? "glow-ember bg-ink-soft text-foam"
                      : "border border-[var(--line)] text-foam/70 hover:text-foam"
                  }`}
                >
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ background: person.color }}
                  />
                  <span>{person.name}</span>
                  {person.role ? <span className="text-foam/40">· {person.role}</span> : null}
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${person.name}`}
                  onClick={() => {
                    if (confirm(`Remove ${person.name} and their memories?`)) onDelete(person.id);
                  }}
                  className="rounded-full px-2 py-1 text-xs text-foam/35 hover:text-ember"
                >
                  ×
                </button>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
