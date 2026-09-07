"use client";

import { useState } from "react";

type Labels = {
  delete: string;
  cancel: string;
  confirmTitle: string;
  confirmBody: string;
};

export function DeleteEventButton({
  action,
  labels,
}: {
  action: () => void | Promise<void>;
  labels: Labels;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="btn-danger"
        onClick={() => setOpen(true)}
      >
        {labels.delete}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="card w-full max-w-sm animate-rise p-6">
            <h3 className="text-lg font-semibold text-ink-900">
              {labels.confirmTitle}
            </h3>
            <p className="mt-2 text-sm text-ink-700/70">{labels.confirmBody}</p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setOpen(false)}
              >
                {labels.cancel}
              </button>
              <form action={action}>
                <button type="submit" className="btn-danger">
                  {labels.delete}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
