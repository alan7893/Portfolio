import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PRIVACY, type PrivacySettings } from "@/lib/privacy";

export async function getPrivacySettings(): Promise<PrivacySettings> {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return DEFAULT_PRIVACY;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      aiCaptionEnabled: true,
      aiGenerateEnabled: true,
      aiShareChildName: true,
      aiAllowDeepseek: true,
    },
  });
  if (!user) return DEFAULT_PRIVACY;
  return {
    aiCaptionEnabled: user.aiCaptionEnabled,
    aiGenerateEnabled: user.aiGenerateEnabled,
    aiShareChildName: user.aiShareChildName,
    aiAllowDeepseek: user.aiAllowDeepseek,
  };
}
