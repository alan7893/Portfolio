import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseCaptionJson } from "./ai-caption";
import { titleLooksLikeFilename } from "./photo-vision";

describe("parseCaptionJson", () => {
  it("reads fenced JSON and maps category", () => {
    const raw = '```json\n{"title":"公園踏單車","category":"sports","eventType":"PHOTO","description":"小朋友喺公園踩單車。","tags":["運動"]}\n```';
    const cap = parseCaptionJson(raw);
    assert.equal(cap.title, "公園踏單車");
    assert.equal(cap.category, "sports");
    assert.equal(cap.eventType, "PHOTO");
    assert.deepEqual(cap.tags, ["運動"]);
  });

  it("falls back when JSON is junk", () => {
    const cap = parseCaptionJson("not json at all");
    assert.equal(cap.title, "");
    assert.equal(cap.category, "");
    assert.equal(cap.eventType, "PHOTO");
  });

  it("rejects unknown categories and types", () => {
    const cap = parseCaptionJson(
      '{"title":"獎盃","category":"food","eventType":"BANANA","description":"ok"}',
    );
    assert.equal(cap.category, "");
    assert.equal(cap.eventType, "PHOTO");
    assert.equal(cap.title, "獎盃");
  });

  it("drops titles that are just a camera file name", () => {
    const cap = parseCaptionJson(
      '{"title":"IMG_4022.HEIC","category":"family","eventType":"PHOTO"}',
    );
    assert.equal(cap.title, "");
  });
});

describe("titleLooksLikeFilename", () => {
  it("detects camera names and extensions", () => {
    assert.equal(titleLooksLikeFilename("IMG_1234"), true);
    assert.equal(titleLooksLikeFilename("park.jpg"), true);
    assert.equal(titleLooksLikeFilename("公園踏單車"), false);
  });
});
