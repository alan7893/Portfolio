export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 200;

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type ChangePasswordIssue =
  | "missingCurrent"
  | "tooShort"
  | "tooLong"
  | "mismatch"
  | "unchanged";

export function validateChangePassword(
  input: ChangePasswordInput,
): ChangePasswordIssue | null {
  const current = input.currentPassword;
  const next = input.newPassword;
  const confirm = input.confirmPassword;
  if (!current) return "missingCurrent";
  if (next.length < MIN_PASSWORD_LENGTH) return "tooShort";
  if (next.length > MAX_PASSWORD_LENGTH) return "tooLong";
  if (next !== confirm) return "mismatch";
  if (next === current) return "unchanged";
  return null;
}
