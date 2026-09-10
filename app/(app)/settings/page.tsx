import { getI18n } from "@/lib/i18n.server";
import { getPrivacySettings } from "@/lib/privacy.server";
import { geminiPaidTierEnabled } from "@/lib/privacy";
import { PrivacyForm } from "@/components/PrivacyForm";
import { PasswordForm } from "@/components/PasswordForm";
import { updatePrivacyAction } from "@/app/actions/privacy";
import { changePasswordAction } from "@/app/actions/password";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; password?: string }>;
}) {
  const { t } = await getI18n();
  const settings = await getPrivacySettings();
  const params = await searchParams;
  const saved = params.saved === "1";
  const passwordSaved = params.password === "1";

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">{t.privacy.title}</h1>
        <p className="mt-2 text-sm text-ink-700/70">{t.privacy.subtitle}</p>
      </div>
      {passwordSaved && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {t.privacy.passwordSaved}
        </p>
      )}
      {saved && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {t.privacy.saved}
        </p>
      )}
      <PasswordForm action={changePasswordAction} t={t} />
      <PrivacyForm
        action={updatePrivacyAction}
        settings={settings}
        geminiPaid={geminiPaidTierEnabled()}
        t={t}
      />
    </div>
  );
}
