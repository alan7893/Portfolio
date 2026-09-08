export type PrivacySettings = {
  aiCaptionEnabled: boolean;
  aiGenerateEnabled: boolean;
  aiShareChildName: boolean;
  aiAllowDeepseek: boolean;
};

export const DEFAULT_PRIVACY: PrivacySettings = {
  aiCaptionEnabled: true,
  aiGenerateEnabled: true,
  aiShareChildName: false,
  aiAllowDeepseek: false,
};

const NAME_REPLACEMENT_ZH = "小朋友";
const NAME_REPLACEMENT_EN = "the child";

export function redactName(
  text: string,
  realName: string,
  locale: "zh-HK" | "en" = "zh-HK",
): string {
  const name = realName.trim();
  if (!name) return text;
  const replacement = locale === "en" ? NAME_REPLACEMENT_EN : NAME_REPLACEMENT_ZH;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(new RegExp(escaped, "gi"), replacement);
}

export function displayChildName(
  realName: string,
  shareName: boolean,
  locale: "zh-HK" | "en" = "zh-HK",
): string {
  if (shareName) return realName;
  return locale === "en" ? NAME_REPLACEMENT_EN : NAME_REPLACEMENT_ZH;
}

export function geminiPaidTierEnabled(): boolean {
  const raw = (process.env["GEMINI_PAID_TIER"] ?? "").trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}
