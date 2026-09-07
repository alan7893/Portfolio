"use client";

import { useMemo, useState, useTransition } from "react";
import type { AppStore, TrackRecord } from "@/lib/types";
import { UserSwitcher } from "@/components/UserSwitcher";
import { OverviewPanel } from "@/components/OverviewPanel";
import { PhotoUploader } from "@/components/PhotoUploader";
import { TrackRecordPanel } from "@/components/TrackRecordPanel";
import { ReportPanel } from "@/components/ReportPanel";

type Props = {
  initialStore: AppStore;
};

export function MemoryApp({ initialStore }: Props) {
  const [store, setStore] = useState<AppStore>(initialStore);
  const [error, setError] = useState<string | null>(null);
  const [section, setSection] = useState<"overview" | "photos" | "records" | "report">(
    "overview",
  );
  const [pending, startTransition] = useTransition();

  const activePerson = useMemo(
    () => store.people.find((p) => p.id === store.activePersonId) ?? null,
    [store],
  );

  const photos = useMemo(
    () => store.photos.filter((p) => p.personId === store.activePersonId),
    [store],
  );

  const records = useMemo(
    () => store.records.filter((r) => r.personId === store.activePersonId),
    [store],
  );

  const report = store.activePersonId ? store.reports[store.activePersonId] ?? null : null;

  async function refresh() {
    const res = await fetch("/api/people");
    if (!res.ok) throw new Error("Failed to load memory store");
    const data = (await res.json()) as AppStore;
    setStore(data);
  }

  function withRefresh(task: () => Promise<void>) {
    startTransition(async () => {
      try {
        setError(null);
        await task();
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  function createPerson(name: string, role?: string) {
    withRefresh(async () => {
      const res = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, role }),
      });
      if (!res.ok) throw new Error("Could not create person");
    });
  }

  function switchPerson(personId: string) {
    withRefresh(async () => {
      const res = await fetch("/api/people", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activePersonId: personId }),
      });
      if (!res.ok) throw new Error("Could not switch person");
    });
  }

  function removePerson(personId: string) {
    withRefresh(async () => {
      const res = await fetch(`/api/people?id=${personId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not remove person");
    });
  }

  function uploadPhoto(file: File) {
    if (!activePerson) return;
    withRefresh(async () => {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/people/${activePerson.id}/photos`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Upload failed");
      }
    });
  }

  function addRecord(input: Omit<TrackRecord, "id" | "personId" | "createdAt">) {
    if (!activePerson) return;
    withRefresh(async () => {
      const res = await fetch(`/api/people/${activePerson.id}/records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Could not save track record");
    });
  }

  function removeRecord(recordId: string) {
    if (!activePerson) return;
    withRefresh(async () => {
      const res = await fetch(`/api/people/${activePerson.id}/records?recordId=${recordId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Could not delete record");
    });
  }

  function generateReport() {
    if (!activePerson) return;
    withRefresh(async () => {
      const res = await fetch(`/api/people/${activePerson.id}/report`, { method: "POST" });
      if (!res.ok) throw new Error("Could not generate report");
      setSection("report");
    });
  }

  return (
    <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 pb-20 pt-8 sm:px-8">
      <header className="animate-rise flex flex-col gap-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-display text-5xl font-extrabold tracking-tight brand-shimmer sm:text-6xl">
              Lumen
            </p>
            <p className="mt-3 max-w-xl text-base text-foam/70 sm:text-lg">
              A memory system for people you care about — photos understood, track records kept,
              portfolios lit by sparkling hours.
            </p>
          </div>
          {pending ? <span className="text-sm text-ember-soft">Syncing…</span> : null}
        </div>

        <UserSwitcher
          people={store.people}
          activePersonId={store.activePersonId}
          onCreate={createPerson}
          onSwitch={switchPerson}
          onDelete={removePerson}
        />
      </header>

      {error ? (
        <div className="panel rounded-2xl px-4 py-3 text-sm text-ember-soft">{error}</div>
      ) : null}

      {!activePerson ? (
        <EmptyState />
      ) : (
        <>
          <nav className="animate-rise-delay flex flex-wrap gap-2">
            {(
              [
                ["overview", "Overview"],
                ["photos", "Photos"],
                ["records", "Track record"],
                ["report", "Portfolio report"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setSection(id)}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  section === id
                    ? "bg-sea text-ink"
                    : "border border-[var(--line)] text-foam/75 hover:border-sea/50 hover:text-foam"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          <main className="animate-rise-delay-2">
            {section === "overview" ? (
              <OverviewPanel
                person={activePerson}
                photos={photos}
                records={records}
                onGoToPhotos={() => setSection("photos")}
                onGoToRecords={() => setSection("records")}
              />
            ) : null}
            {section === "photos" ? (
              <PhotoUploader
                person={activePerson}
                photos={photos}
                onUpload={uploadPhoto}
                busy={pending}
              />
            ) : null}
            {section === "records" ? (
              <TrackRecordPanel
                person={activePerson}
                records={records}
                onAdd={addRecord}
                onDelete={removeRecord}
                busy={pending}
              />
            ) : null}
            {section === "report" ? (
              <ReportPanel
                person={activePerson}
                report={report}
                onGenerate={generateReport}
                busy={pending}
                photoCount={photos.length}
                recordCount={records.length}
              />
            ) : null}
          </main>
        </>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <section className="panel animate-rise-delay rounded-[1.75rem] px-6 py-14 text-center sm:px-10">
      <h2 className="font-display text-3xl text-foam">Start with a person</h2>
      <p className="mx-auto mt-3 max-w-md text-foam/65">
        Create a profile above, then upload photos and log track records. Lumen will read the
        moments and draft a portfolio report.
      </p>
      <p className="mt-6 text-sm text-ember">Tip: switch users anytime from the profile row</p>
    </section>
  );
}
