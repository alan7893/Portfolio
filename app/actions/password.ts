"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { compare, hash } from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getI18n } from "@/lib/i18n.server";
import type { ActionState } from "@/lib/action-state";
import { validateChangePassword } from "@/lib/password";
import { checkRateLimit, registerFailedAttempt, clearAttempts } from "@/lib/rateLimit";

export async function changePasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return { error: "Unauthorized" };

  const { t } = await getI18n();
  const limit = checkRateLimit(`password:${userId}`);
  if (!limit.allowed) {
    return { error: t.auth.rateLimited.replace("{seconds}", String(limit.retryAfterSeconds)) };
  }

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const issue = validateChangePassword({ currentPassword, newPassword, confirmPassword });
  if (issue === "missingCurrent") return { error: t.privacy.passwordMissingCurrent };
  if (issue === "tooShort") return { error: t.privacy.passwordTooShort };
  if (issue === "tooLong") return { error: t.privacy.passwordTooLong };
  if (issue === "mismatch") return { error: t.privacy.passwordMismatch };
  if (issue === "unchanged") return { error: t.privacy.passwordSame };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true },
  });
  if (!user) return { error: "Unauthorized" };

  const valid = await compare(currentPassword, user.passwordHash);
  if (!valid) {
    registerFailedAttempt(`password:${userId}`);
    return { error: t.privacy.passwordWrong };
  }

  const passwordHash = await hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
  clearAttempts(`password:${userId}`);
  revalidatePath("/settings");
  redirect("/settings?password=1");
}
