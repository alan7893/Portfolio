"use client";

import { useRef, useState } from "react";
import { ACCEPTED_MIME, MAX_FILE_BYTES, mimeFromName } from "@/lib/constants";
import { interpolate } from "@/lib/i18n";

type Labels = {
  dropHint: string;
  accept: string;
  selected: string;
  tooLarge: string;
  badType: string;
  remove: string;
};

export function FileUploader({
  labels,
  onFiles,
}: {
  labels: Labels;
  onFiles?: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [names, setNames] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);

  function syncFromInput() {
    const files = inputRef.current?.files;
    if (!files) return;
    const accepted: File[] = [];
    const nextNames: string[] = [];
    const nextWarnings: string[] = [];
    for (const f of Array.from(files)) {
      const type = f.type || mimeFromName(f.name);
      if (!ACCEPTED_MIME.includes(type as (typeof ACCEPTED_MIME)[number])) {
        nextWarnings.push(interpolate(labels.badType, { name: f.name }));
        continue;
      }
      if (f.size > MAX_FILE_BYTES) {
        nextWarnings.push(interpolate(labels.tooLarge, { name: f.name }));
        continue;
      }
      accepted.push(f);
      nextNames.push(f.name);
    }
    setNames(nextNames);
    setWarnings(nextWarnings);
    onFiles?.(accepted);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (!inputRef.current || !e.dataTransfer.files?.length) return;
    const dt = new DataTransfer();
    for (const f of Array.from(e.dataTransfer.files)) dt.items.add(f);
    inputRef.current.files = dt.files;
    syncFromInput();
  }

  function clearAll() {
    if (inputRef.current) inputRef.current.value = "";
    setNames([]);
    setWarnings([]);
    onFiles?.([]);
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`grid cursor-pointer place-items-center gap-1 rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
          dragging
            ? "border-brand-500 bg-brand-50"
            : "border-black/15 bg-white/60 hover:border-brand-400"
        }`}
      >
        <span className="text-2xl">📎</span>
        <span className="text-sm font-medium text-ink-800">
          {labels.dropHint}
        </span>
        <span className="text-xs text-ink-700/60">{labels.accept}</span>
      </div>
      <input
        ref={inputRef}
        type="file"
        name="files"
        multiple
        accept={`${ACCEPTED_MIME.join(",")},.heic,.heif,.jpg,.jpeg,.png,.webp`}
        className="hidden"
        onChange={syncFromInput}
      />
      {names.length > 0 && (
        <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
          <span>{interpolate(labels.selected, { count: names.length })}</span>
          <button
            type="button"
            onClick={clearAll}
            className="text-xs underline"
          >
            {labels.remove}
          </button>
        </div>
      )}
      {names.length > 0 && (
        <ul className="mt-1 list-inside list-disc text-xs text-ink-700/70">
          {names.map((n, i) => (
            <li key={i} className="truncate">
              {n}
            </li>
          ))}
        </ul>
      )}
      {warnings.map((w, i) => (
        <p key={i} className="mt-1 text-xs text-red-600">
          {w}
        </p>
      ))}
    </div>
  );
}
