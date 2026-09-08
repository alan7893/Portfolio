import sharp from "sharp";

/** Longest edge sent to the vision model. Original stays on our server. */
export const VISION_MAX_EDGE = 1024;
const VISION_JPEG_QUALITY = 78;

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

export function titleLooksLikeFilename(title: string): boolean {
  const t = title.trim();
  if (!t) return false;
  if (/\.(jpe?g|png|heic|heif|webp|gif|mov|mp4)$/i.test(t)) return true;
  if (/^(IMG|DSC|DSCN|DCIM|PXL|MVIMG|VID|Screenshot|屏幕快照)[-_ ]?\d+/i.test(t)) return true;
  if (/^IMG[-_ ]?\d+/i.test(t)) return true;
  return false;
}
