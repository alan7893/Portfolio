import { getI18n } from "@/lib/i18n.server";
import { ChildForm } from "@/components/ChildForm";
import { createChildAction } from "@/app/actions/children";

export const dynamic = "force-dynamic";

export default async function NewChildPage() {
  const { t } = await getI18n();
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-2xl font-bold text-ink-900">{t.children.addChild}</h1>
      <div className="card p-6">
        <ChildForm action={createChildAction} t={t} cancelHref="/children" />
      </div>
    </div>
  );
}
