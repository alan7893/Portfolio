import sharp from "sharp";

/** Longest edge sent to the vision model. Keep medals in-hand readable. */
export const VISION_MAX_EDGE = 1600;
const VISION_JPEG_QUALITY = 88;

export type VisionJpeg = {
  mimeType: "image/jpeg";
  dataBase64: string;
  width: number;
  height: number;
  bytes: number;
};

/**
 * Make a small JPEG for captioning:
 * - apply EXIF orientation then drop GPS/device metadata
 * - shrink so the original family photo is not sent
 * - re-encode as JPEG (HEIC/PNG/WebP included)
 */
export async function prepareVisionJpeg(input: Buffer): Promise<VisionJpeg> {
  const pipeline = sharp(input, { failOn: "none", animated: false })
    .rotate()
    .resize({
      width: VISION_MAX_EDGE,
      height: VISION_MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: VISION_JPEG_QUALITY, mozjpeg: true });

  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
  if (!data.length || !info.width || !info.height) {
    throw new Error("Could not prepare a caption image.");
  }
  return {
    mimeType: "image/jpeg",
    dataBase64: data.toString("base64"),
    width: info.width,
    height: info.height,
    bytes: data.length,
  };
}

const EXIF_DATE_RE = /(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/g;

function ymdIfValid(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const nowYear = new Date().getFullYear();
  if (year < 1990 || year > nowYear + 1) return null;
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (dt.getUTCFullYear() !== year || dt.getUTCMonth() !== month - 1 || dt.getUTCDate() !== day) {
    return null;
  }
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Read a camera date from EXIF bytes. Does not use GPS. */
export function parseExifTakenDate(input: Buffer): string | null {
  const slice = input.subarray(0, Math.min(input.length, 512 * 1024));
  const text = slice.toString("latin1");
  EXIF_DATE_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = EXIF_DATE_RE.exec(text))) {
    const ymd = ymdIfValid(Number(match[1]), Number(match[2]), Number(match[3]));
    if (ymd) return ymd;
  }
  return null;
}

/**
 * Date the photo was taken, from the original file only.
 * Used as the event date so a 2020 kindergarten photo stays in kindergarten.
 * Never sent to the AI model.
 */
export async function extractPhotoTakenAt(input: Buffer): Promise<string | null> {
  try {
    const meta = await sharp(input, { failOn: "none", animated: false }).metadata();
    if (meta.exif) {
      const fromMeta = parseExifTakenDate(Buffer.from(meta.exif));
      if (fromMeta) return fromMeta;
    }
  } catch {
    // Still scan the raw bytes below.
  }
  return parseExifTakenDate(input);
}

export function titleLooksLikeFilename(title: string): boolean {
  const t = title.trim();
  if (!t) return false;
  if (/\.(jpe?g|png|heic|heif|webp|gif|mov|mp4)$/i.test(t)) return true;
  if (/^(IMG|DSC|DSCN|DCIM|PXL|MVIMG|VID|Screenshot|屏幕快照)[-_ ]?\d+/i.test(t)) return true;
  if (/^IMG[-_ ]?\d+/i.test(t)) return true;
  return false;
}
