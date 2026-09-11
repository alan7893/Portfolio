import assert from "node:assert/strict";
import { describe, it } from "node:test";
import sharp from "sharp";
import { prepareVisionJpeg, VISION_MAX_EDGE, parseExifTakenDate, parseFilenameTakenDate } from "./photo-vision";

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

  it("prefers DateTimeOriginal over a later software date", () => {
    const buf = Buffer.from(
      "DateTimeOriginal\x002018:03:04 08:00:00\x00DateTime\x002026:01:01 00:00:00",
      "latin1",
    );
    assert.equal(parseExifTakenDate(buf), "2018-03-04");
  });
});

describe("parseFilenameTakenDate", () => {
  it("reads camera-style names", () => {
    assert.equal(parseFilenameTakenDate("IMG_20200615_093000.jpg"), "2020-06-15");
    assert.equal(parseFilenameTakenDate("PXL_2020-06-15_123.jpg"), "2020-06-15");
    assert.equal(parseFilenameTakenDate("WhatsApp Image 2019-12-01 at 12.00.00.jpg"), "2019-12-01");
  });

  it("ignores names without a full calendar date", () => {
    assert.equal(parseFilenameTakenDate("IMG_4022.HEIC"), null);
    assert.equal(parseFilenameTakenDate("photo.png"), null);
  });
});
