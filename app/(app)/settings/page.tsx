import { getI18n } from "@/lib/i18n.server";
import { getPrivacySettings } from "@/lib/privacy.server";
import { geminiPaidTierEnabled } from "@/lib/privacy";
import { PrivacyForm } from "@/components/PrivacyForm";
import { updatePrivacyAction } from "@/app/actions/privacy";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { t } = await getI18n();
  const settings = await getPrivacySettings();
  const saved = (await searchParams).saved === "1";

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">{t.privacy.title}</h1>
        <p className="mt-2 text-sm text-ink-700/70">{t.privacy.subtitle}</p>
      </div>
      {saved && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {t.privacy.saved}
        </p>
      )}
      <PrivacyForm
        action={updatePrivacyAction}
        settings={settings}
        geminiPaid={geminiPaidTierEnabled()}
        t={t}
      />
    </div>
  );
}
