export function isUploadBusy(status: string): boolean {
  return status === "queued" || status === "uploading";
}

export function isCaptionBusy(status: string): boolean {
  return status === "captioning";
}

export function isSavableItem(item: {
  skipped: boolean;
  stagedId: string;
  status: string;
}): boolean {
  return !item.skipped && Boolean(item.stagedId) && !isUploadBusy(item.status);
}

export function keepCameraDate(
  current: { suggestedDate: string; dateFromPhoto: boolean },
  incoming?: string | null,
): { suggestedDate: string; dateFromPhoto: boolean } {
  if (current.dateFromPhoto) return current;
  if (incoming) return { suggestedDate: incoming, dateFromPhoto: true };
  return current;
}

export function dateFromCameraOrToday(
  photoTakenAt: string | null | undefined,
  today: string,
): { suggestedDate: string; dateFromPhoto: boolean } {
  if (photoTakenAt) return { suggestedDate: photoTakenAt, dateFromPhoto: true };
  return { suggestedDate: today, dateFromPhoto: false };
}
