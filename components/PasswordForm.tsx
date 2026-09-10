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

export function PasswordForm({
  action,
  t,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  t: Dictionary;
}) {
  const [state, formAction] = useFormState(action, { error: null });

  return (
    <form id="password" action={formAction} className="card space-y-4 p-6">
      <div>
        <h2 className="text-lg font-semibold text-ink-900">{t.privacy.passwordTitle}</h2>
        <p className="mt-1 text-sm text-ink-700/70">{t.privacy.passwordHint}</p>
      </div>
      <div>
        <label className="label" htmlFor="currentPassword">
          {t.privacy.currentPassword}
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          className="input"
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="newPassword">
          {t.privacy.newPassword}
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          className="input"
          minLength={8}
          maxLength={200}
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="confirmPassword">
          {t.privacy.confirmPassword}
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          className="input"
          minLength={8}
          maxLength={200}
          required
        />
      </div>
      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      <SubmitButton label={t.privacy.passwordSave} pendingLabel={t.common.loading} />
    </form>
  );
}
