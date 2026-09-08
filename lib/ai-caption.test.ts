import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseCaptionJson, refineCaption, parseAwardDetect, hasAwardObject } from "./ai-caption";
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

describe("refineCaption", () => {
  it("treats a swimming medal as a competition prize, not a lesson", () => {
    const cap = refineCaption(
      {
        title: "游泳課",
        category: "sports",
        eventType: "PHOTO",
        description: "小朋友手上拿住一塊游泳獎牌。",
        tags: ["游泳"],
      },
      "zh-HK",
    );
    assert.equal(cap.eventType, "PRIZE");
    assert.equal(cap.title, "游泳比賽得獎");
    assert.equal(cap.category, "sports");
  });

  it("keeps an ordinary snapshot as PHOTO", () => {
    const cap = refineCaption(
      {
        title: "公園踏單車",
        category: "family",
        eventType: "PHOTO",
        description: "小朋友喺公園踩單車。",
        tags: [],
      },
      "zh-HK",
    );
    assert.equal(cap.eventType, "PHOTO");
    assert.equal(cap.title, "公園踏單車");
  });

  it("forces a prize when the detector saw a medal in hand, even if the title missed it", () => {
    const cap = refineCaption(
      {
        title: "喺泳池",
        category: "",
        eventType: "PHOTO",
        description: "小朋友喺泳池邊微笑。",
        tags: ["游泳"],
      },
      "zh-HK",
      {
        holdingMedal: true,
        wearingMedal: false,
        holdingTrophy: false,
        isLesson: false,
        sportHint: "swimming",
      },
    );
    assert.equal(cap.eventType, "PRIZE");
    assert.equal(cap.title, "游泳比賽得獎");
    assert.equal(cap.category, "sports");
  });
});

describe("parseAwardDetect", () => {
  it("reads medal flags", () => {
    const facts = parseAwardDetect(
      '{"holdingMedal":true,"wearingMedal":false,"holdingTrophy":false,"isLesson":false,"sportHint":"swimming"}',
    );
    assert.equal(facts.holdingMedal, true);
    assert.equal(hasAwardObject(facts), true);
    assert.equal(facts.sportHint, "swimming");
  });
});

