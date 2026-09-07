"use client";

import { useState } from "react";

export type GalleryItem = {
  id: string;
  fileType: string;
  originalName: string;
};

export function MediaGallery({
  items,
  emptyLabel,
}: {
  items: GalleryItem[];
  emptyLabel: string;
}) {
  const [active, setActive] = useState<GalleryItem | null>(null);
  const images = items.filter((i) => i.fileType.startsWith("image/"));
  const others = items.filter((i) => !i.fileType.startsWith("image/"));

  if (items.length === 0) {
    return <p className="text-sm text-ink-700/60">{emptyLabel}</p>;
  }

  return (
    <>
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setActive(m)}
              className="group relative aspect-square overflow-hidden rounded-xl border border-black/5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/media/${m.id}`}
                alt={m.originalName}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
            </button>
          ))}
        </div>
      )}

      {others.length > 0 && (
        <ul className="mt-3 space-y-2">
          {others.map((m) => (
            <li key={m.id}>
              <a
                href={`/api/media/${m.id}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink-800 hover:bg-black/5"
              >
                <span>{m.fileType.includes("pdf") ? "📄" : "🎬"}</span>
                <span className="truncate">{m.originalName}</span>
              </a>
            </li>
          ))}
        </ul>
      )}

      {active && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4"
          onClick={() => setActive(null)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 text-3xl text-white/80 hover:text-white"
            onClick={() => setActive(null)}
          >
            ×
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/media/${active.id}`}
            alt={active.originalName}
            className="max-h-[85vh] max-w-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
