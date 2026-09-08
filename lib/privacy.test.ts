import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { displayChildName, redactName } from "./privacy";

describe("redactName", () => {
  it("replaces the child’s name in titles and notes", () => {
    assert.equal(
      redactName("Warren 游泳比賽得獎", "Warren", "zh-HK"),
      "小朋友 游泳比賽得獎",
    );
    assert.equal(
      redactName("Ada won gold", "Ada", "en"),
      "the child won gold",
    );
  });
});

describe("displayChildName", () => {
  it("hides the real name unless sharing is on", () => {
    assert.equal(displayChildName("Warren", false, "zh-HK"), "小朋友");
    assert.equal(displayChildName("Warren", true, "zh-HK"), "Warren");
  });
});
