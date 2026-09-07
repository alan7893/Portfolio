"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { Dictionary } from "@/lib/i18n";
import type { ActionState } from "@/lib/action-state";

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? pendingLabel : label}
    </button>
  );
}

export type ChildFormDefaults = {
  name?: string;
  birthDate?: string;
  school?: string;
  notes?: string;
};

export function ChildForm({
  action,
  defaults,
  t,
  cancelHref,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  defaults?: ChildFormDefaults;
  t: Dictionary;
  cancelHref: string;
}) {
  const [state, formAction] = useFormState(action, { error: null });

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label className="label">{t.children.name}</label>
        <input
          name="name"
          className="input"
          defaultValue={defaults?.name ?? ""}
          maxLength={80}
          required
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">{t.children.birthDate}</label>
          <input
            type="date"
            name="birthDate"
            className="input"
            defaultValue={defaults?.birthDate ?? ""}
            required
          />
        </div>
        <div>
          <label className="label">
            {t.children.school}{" "}
            <span className="text-xs text-ink-700/50">({t.common.optional})</span>
          </label>
          <input
            name="school"
            className="input"
            defaultValue={defaults?.school ?? ""}
            maxLength={120}
          />
        </div>
      </div>
      <div>
        <label className="label">
          {t.children.notes}{" "}
          <span className="text-xs text-ink-700/50">({t.common.optional})</span>
        </label>
        <textarea
          name="notes"
          className="input min-h-[96px]"
          defaultValue={defaults?.notes ?? ""}
          maxLength={2000}
        />
      </div>
      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <div className="flex items-center gap-3 pt-2">
        <SubmitButton label={t.common.save} pendingLabel={t.common.loading} />
        <a href={cancelHref} className="btn-ghost">
          {t.common.cancel}
        </a>
      </div>
    </form>
  );
}
