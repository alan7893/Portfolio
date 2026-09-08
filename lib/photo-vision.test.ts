import assert from "node:assert/strict";
import { describe, it } from "node:test";
import sharp from "sharp";
import { prepareVisionJpeg, VISION_MAX_EDGE } from "./photo-vision";

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
