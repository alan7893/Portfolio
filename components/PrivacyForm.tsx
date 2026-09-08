"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { Dictionary } from "@/lib/i18n";
import type { ActionState } from "@/lib/action-state";
import type { PrivacySettings } from "@/lib/privacy";

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? pendingLabel : label}
    </button>
  );
}

export function PrivacyForm({
  action,
  settings,
  geminiPaid,
  t,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  settings: PrivacySettings;
  geminiPaid: boolean;
  t: Dictionary;
}) {
  const [state, formAction] = useFormState(action, { error: null });

  return (
    <form action={formAction} className="space-y-6">
      <section className="card space-y-2 p-6">
        <h2 className="text-lg font-semibold text-ink-900">{t.privacy.publicTitle}</h2>
        <p className="text-sm text-ink-700/80">{t.privacy.publicBody}</p>
        <p className="text-sm text-emerald-800">{t.privacy.neverPublic}</p>
      </section>

      <section className="card space-y-2 p-6">
        <h2 className="text-lg font-semibold text-ink-900">{t.privacy.aiTitle}</h2>
        <p className="text-sm text-ink-700/80">{t.privacy.aiBody}</p>
      </section>

      <section className="card space-y-2 p-6">
        <h2 className="text-lg font-semibold text-ink-900">{t.privacy.geminiTitle}</h2>
        <p className="text-sm text-ink-700/80">
          {geminiPaid ? t.privacy.geminiPaid : t.privacy.geminiUnpaid}
        </p>
      </section>

      <section className="card space-y-2 p-6">
        <h2 className="text-lg font-semibold text-ink-900">{t.privacy.deepseekTitle}</h2>
        <p className="text-sm text-ink-700/80">{t.privacy.deepseekBody}</p>
      </section>

      <section className="card space-y-3 p-6">
        <label className="flex items-start gap-2 text-sm text-ink-800">
          <input
            type="checkbox"
            name="aiCaptionEnabled"
            value="true"
            defaultChecked={settings.aiCaptionEnabled}
            className="mt-1"
          />
          <span>{t.privacy.caption}</span>
        </label>
        <label className="flex items-start gap-2 text-sm text-ink-800">
          <input
            type="checkbox"
            name="aiGenerateEnabled"
            value="true"
            defaultChecked={settings.aiGenerateEnabled}
            className="mt-1"
          />
          <span>{t.privacy.generate}</span>
        </label>
        <label className="flex items-start gap-2 text-sm text-ink-800">
          <input
            type="checkbox"
            name="aiShareChildName"
            value="true"
            defaultChecked={settings.aiShareChildName}
            className="mt-1"
          />
          <span>{t.privacy.shareName}</span>
        </label>
        <label className="flex items-start gap-2 text-sm text-ink-800">
          <input
            type="checkbox"
            name="aiAllowDeepseek"
            value="true"
            defaultChecked={settings.aiAllowDeepseek}
            className="mt-1"
          />
          <span>{t.privacy.allowDeepseek}</span>
        </label>
      </section>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      <SubmitButton label={t.common.save} pendingLabel={t.common.loading} />
    </form>
  );
}
