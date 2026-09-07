import { notFound } from "next/navigation";
import { getI18n } from "@/lib/i18n.server";
import { prisma } from "@/lib/prisma";
import { ChildForm } from "@/components/ChildForm";
import { updateChildAction } from "@/app/actions/children";

export const dynamic = "force-dynamic";

export default async function EditChildPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { t } = await getI18n();
  const child = await prisma.child.findUnique({ where: { id } });
  if (!child) notFound();

  const bound = updateChildAction.bind(null, child.id);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-2xl font-bold text-ink-900">{t.children.editChild}</h1>
      <div className="card p-6">
        <ChildForm
          action={bound}
          t={t}
          cancelHref="/children"
          defaults={{
            name: child.name,
            birthDate: child.birthDate.toISOString().slice(0, 10),
            school: child.school ?? "",
            notes: child.notes ?? "",
          }}
        />
      </div>
    </div>
  );
}
