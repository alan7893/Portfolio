"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { childInputSchema } from "@/lib/validation";
import { setActiveChildCookie } from "@/lib/child.server";
import type { ActionState } from "@/lib/action-state";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

function readChildForm(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    birthDate: String(formData.get("birthDate") ?? ""),
    school: String(formData.get("school") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  };
}

export async function createChildAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireSession();
  const parsed = childInputSchema.safeParse(readChildForm(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const child = await prisma.child.create({
    data: {
      name: parsed.data.name,
      birthDate: new Date(parsed.data.birthDate),
      school: parsed.data.school || null,
      notes: parsed.data.notes || null,
    },
  });

  await setActiveChildCookie(child.id);
  revalidatePath("/");
  revalidatePath("/children");
  revalidatePath("/events");
  revalidatePath("/timeline");
  revalidatePath("/ai");
  redirect("/children");
}

export async function updateChildAction(
  childId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireSession();
  const parsed = childInputSchema.safeParse(readChildForm(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await prisma.child.update({
    where: { id: childId },
    data: {
      name: parsed.data.name,
      birthDate: new Date(parsed.data.birthDate),
      school: parsed.data.school || null,
      notes: parsed.data.notes || null,
    },
  });

  revalidatePath("/");
  revalidatePath("/children");
  revalidatePath(`/children/${childId}/edit`);
  redirect("/children");
}

export async function deleteChildAction(childId: string) {
  await requireSession();
  await prisma.child.delete({ where: { id: childId } });
  await setActiveChildCookie(null);
  revalidatePath("/");
  revalidatePath("/children");
  revalidatePath("/events");
  revalidatePath("/timeline");
  revalidatePath("/ai");
  redirect("/children");
}
