"use client";

import { useRef, useState } from "react";
import type { Person, PhotoMemory } from "@/lib/types";

type Props = {
  person: Person;
  photos: PhotoMemory[];
  onUpload: (file: File) => void;
  busy: boolean;
};

export function PhotoUploader({ person, photos, onUpload, busy }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    onUpload(file);
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`panel rounded-[1.75rem] p-6 transition sm:p-8 ${
          dragging ? "border-ember glow-ember" : ""
        }`}
      >
        <p className="text-xs uppercase tracking-[0.18em] text-foam/45">Photo memory</p>
        <h2 className="font-display mt-2 text-3xl text-foam">Upload for {person.name}</h2>
        <p className="mt-3 max-w-md text-foam/65">
          Lumen reads the image — mood, setting, and a sparkling-hour cue — then stores it with this
          profile.
        </p>

        <div className="mt-8 flex flex-col items-start gap-4">
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="rounded-full bg-sea px-5 py-3 text-sm font-medium text-ink transition hover:bg-sea/90 disabled:opacity-60"
          >
            {busy ? "Reading photo…" : "Choose photo"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <p className="text-sm text-foam/45">Or drop an image onto this panel</p>
        </div>
      </div>

      <div className="panel rounded-[1.75rem] p-5 sm:p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-foam/45">Understood so far</p>
        <div className="mt-4 space-y-4">
          {photos.length === 0 ? (
            <p className="text-sm text-foam/50">No photos yet for this person.</p>
          ) : (
            photos.map((photo) => (
              <article key={photo.id} className="overflow-hidden rounded-2xl border border-[var(--line)]">
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
                    <span className="rounded-full border border-[var(--line)] px-2 py-0.5 text-[11px] text-foam/40">
                      {photo.analysis.source === "openai" ? "AI vision" : "local vision"}
                    </span>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
