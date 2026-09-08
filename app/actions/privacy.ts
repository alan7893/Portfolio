"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionState } from "@/lib/action-state";
import { parseNameOnEvidence } from "@/lib/validation";

export async function updatePrivacyAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return { error: "Unauthorized" };

  await prisma.user.update({
    where: { id: userId },
    data: {
      aiCaptionEnabled: parseNameOnEvidence(String(formData.get("aiCaptionEnabled") ?? "")),
      aiGenerateEnabled: parseNameOnEvidence(String(formData.get("aiGenerateEnabled") ?? "")),
      aiShareChildName: parseNameOnEvidence(String(formData.get("aiShareChildName") ?? "")),
      aiAllowDeepseek: parseNameOnEvidence(String(formData.get("aiAllowDeepseek") ?? "")),
    },
  });

  revalidatePath("/settings");
  revalidatePath("/ai");
  revalidatePath("/events/new");
  redirect("/settings?saved=1");
}
