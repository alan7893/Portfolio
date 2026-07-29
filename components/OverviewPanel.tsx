"use client";

import type { Person, PhotoMemory, TrackRecord } from "@/lib/types";

type Props = {
  person: Person;
  photos: PhotoMemory[];
  records: TrackRecord[];
  onGoToPhotos: () => void;
  onGoToRecords: () => void;
};

export function OverviewPanel({ person, photos, records, onGoToPhotos, onGoToRecords }: Props) {
  return (
    <section className="grid gap-6">
      <div className="panel rounded-[1.75rem] p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-foam/45">Overview</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl text-foam">Memory board for {person.name}</h2>
            <p className="mt-2 max-w-2xl text-foam/65">
              See the uploaded photos and the track record together in one place.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onGoToPhotos}
              className="rounded-full bg-sea px-4 py-2 text-sm font-medium text-ink hover:bg-sea/90"
            >
              Add photo
            </button>
            <button
              type="button"
              onClick={onGoToRecords}
              className="rounded-full bg-ember px-4 py-2 text-sm font-medium text-ink hover:bg-ember-soft"
            >
              Add record
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatCard label="Uploaded photos" value={String(photos.length)} accent="text-sea" />
          <StatCard label="Track records" value={String(records.length)} accent="text-ember" />
          <StatCard
            label="Latest sparkle"
            value={records[0] ? `${records[0].highlight}/5` : "—"}
            accent="text-foam"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="panel rounded-[1.75rem] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-foam/45">Uploaded photos</p>
              <p className="mt-1 text-sm text-foam/55">Each photo stays attached to this person.</p>
            </div>
            <button
              type="button"
              onClick={onGoToPhotos}
              className="text-sm text-sea hover:text-foam"
            >
              Open photo tab
            </button>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {photos.length === 0 ? (
              <EmptyCard
                title="No photos yet"
                body="Upload a photo and it will appear here with its analysis."
              />
            ) : (
              photos.map((photo) => (
                <article
                  key={photo.id}
                  className="overflow-hidden rounded-2xl border border-[var(--line)] bg-ink/20"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt={photo.filename} className="h-40 w-full object-cover" />
                  <div className="space-y-2 p-4">
                    <p className="text-sm text-foam">{photo.analysis.summary}</p>
                    <p className="text-xs text-ember-soft">{photo.analysis.sparklingMoment}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {photo.analysis.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-[var(--line)] px-2 py-0.5 text-[11px] text-foam/60"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="panel rounded-[1.75rem] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-foam/45">Track record</p>
              <p className="mt-1 text-sm text-foam/55">Timeline of wins, moments, and progress.</p>
            </div>
            <button
              type="button"
              onClick={onGoToRecords}
              className="text-sm text-ember hover:text-foam"
            >
              Open record tab
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {records.length === 0 ? (
              <EmptyCard
                title="No records yet"
                body="Add a dated memory and it will appear here in the timeline."
              />
            ) : (
              records.map((record) => (
                <article
                  key={record.id}
                  className="rounded-2xl border border-[var(--line)] bg-ink/25 px-4 py-3"
                >
                  <h3 className="font-medium text-foam">{record.title}</h3>
                  <p className="mt-1 text-xs text-foam/45">
                    {record.date} · {record.category} · sparkle {record.highlight}/5
                  </p>
                  {record.notes ? <p className="mt-2 text-sm text-foam/70">{record.notes}</p> : null}
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-ink/20 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-foam/45">{label}</p>
      <p className={`mt-2 font-display text-3xl ${accent}`}>{value}</p>
    </div>
  );
}

function EmptyCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--line)] bg-ink/10 p-5 text-sm">
      <p className="font-medium text-foam/75">{title}</p>
      <p className="mt-2 text-foam/50">{body}</p>
    </div>
  );
}
