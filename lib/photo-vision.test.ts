import assert from "node:assert/strict";
import { describe, it } from "node:test";
import sharp from "sharp";
import { prepareVisionJpeg, VISION_MAX_EDGE, parseExifTakenDate } from "./photo-vision";

describe("prepareVisionJpeg", () => {
  it("re-encodes a large image as a small JPEG without keeping the original size", async () => {
    const input = await sharp({
      create: {
        width: 2000,
        height: 1500,
        channels: 3,
        background: { r: 16, g: 116, b: 150 },
      },
    })
      .jpeg()
      .toBuffer();
    assert.ok(input.length > 8_000);

    const vision = await prepareVisionJpeg(input);
    assert.equal(vision.mimeType, "image/jpeg");
    assert.ok(vision.width <= VISION_MAX_EDGE);
    assert.ok(vision.height <= VISION_MAX_EDGE);
    assert.ok(vision.bytes < input.length);
    assert.ok(vision.dataBase64.length > 0);
    assert.equal(Buffer.from(vision.dataBase64, "base64").subarray(0, 2).toString("hex"), "ffd8");
  });
});

describe("parseExifTakenDate", () => {
  it("reads a camera DateTimeOriginal string and ignores junk", () => {
    const buf = Buffer.from("XXXXDateTimeOriginal\x002020:06:15 09:30:00GPS more", "latin1");
    assert.equal(parseExifTakenDate(buf), "2020-06-15");
  });

  it("rejects impossible dates", () => {
    assert.equal(parseExifTakenDate(Buffer.from("0000:00:00 00:00:00")), null);
    assert.equal(parseExifTakenDate(Buffer.from("1990:13:40 00:00:00")), null);
  });
});
