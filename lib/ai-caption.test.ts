import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseCaptionJson } from "./ai-caption";

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
    assert.equal(cap.title, "相片");
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
});
