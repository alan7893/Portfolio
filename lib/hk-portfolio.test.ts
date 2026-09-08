import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  evidenceGaps,
  isEvidenceHeavy,
  suggestedTrack,
  normalizeAiKind,
  wuYuCoverage,
  trackWarnings,
} from "./hk-portfolio";

const now = new Date("2026-09-08T00:00:00Z");

describe("suggestedTrack", () => {
  it("maps kindergarten age to 小一", () => {
    assert.equal(suggestedTrack("2021-09-02", now), "p1");
  });

  it("maps late primary to 中一", () => {
    assert.equal(suggestedTrack("2014-06-01", now), "s1");
  });

  it("maps senior secondary to JUPAS", () => {
    assert.equal(suggestedTrack("2008-01-15", now), "jupas");
  });
});

describe("normalizeAiKind", () => {
  it("maps the old portfolio kind to 小一", () => {
    assert.equal(normalizeAiKind("portfolio"), "p1");
    assert.equal(normalizeAiKind("jupas"), "jupas");
  });
});

describe("evidenceGaps", () => {
  it("asks for name-on-medal proof on a prize photo", () => {
    const gaps = evidenceGaps({
      eventType: "PRIZE",
      photoPurpose: "medal",
      officialName: "",
      organiser: "",
      role: "",
      achievementRank: "金牌",
      nameOnEvidence: false,
      childReflection: "",
      category: "sports",
      hasMedia: true,
      description: "小朋友手上拿住獎牌",
    });
    assert.equal(isEvidenceHeavy({ eventType: "PRIZE", photoPurpose: "medal" }), true);
    assert.ok(gaps.includes("officialName"));
    assert.ok(gaps.includes("organiser"));
    assert.ok(gaps.includes("nameOnEvidence"));
    assert.ok(gaps.includes("role"));
    assert.ok(!gaps.includes("rank"));
  });

  it("asks for a feeling caption on a lifestyle photo", () => {
    const gaps = evidenceGaps({
      eventType: "PHOTO",
      photoPurpose: "lifestyle",
      officialName: "",
      organiser: "",
      role: "",
      achievementRank: "",
      nameOnEvidence: false,
      childReflection: "",
      category: "family",
      hasMedia: true,
      description: "",
    });
    assert.deepEqual(gaps, ["reflection"]);
  });
});

describe("wuYuCoverage", () => {
  it("counts 五育 pillars from categories", () => {
    const counts = wuYuCoverage([
      { category: "sports" },
      { category: "arts" },
      { category: "service" },
    ]);
    assert.equal(counts.physical, 1);
    assert.equal(counts.aesthetic, 1);
    assert.equal(counts.moral, 1);
    assert.equal(counts.social, 1);
    assert.equal(counts.intellectual, 0);
  });
});

describe("trackWarnings", () => {
  it("flags a certificate-only 小一 set", () => {
    const warnings = trackWarnings("p1", [
      { eventType: "PRIZE", photoPurpose: "certificate", category: "academic", nameOnEvidence: true, officialName: "a", organiser: "b", role: "participant", achievementRank: "1", hasMedia: true },
      { eventType: "PRIZE", photoPurpose: "medal", category: "sports", nameOnEvidence: true, officialName: "a", organiser: "b", role: "participant", achievementRank: "1", hasMedia: true },
      { eventType: "PRIZE", photoPurpose: "certificate", category: "music", nameOnEvidence: true, officialName: "a", organiser: "b", role: "participant", achievementRank: "1", hasMedia: true },
      { eventType: "PRIZE", photoPurpose: "certificate", category: "arts", nameOnEvidence: true, officialName: "a", organiser: "b", role: "participant", achievementRank: "1", hasMedia: true },
    ]);
    assert.ok(warnings.includes("certificateHeavy"));
  });

  it("flags more than ten JUPAS award items", () => {
    const events = Array.from({ length: 11 }, () => ({
      eventType: "PRIZE",
      photoPurpose: "medal",
      officialName: "賽",
      organiser: "會",
      role: "participant",
      achievementRank: "冠軍",
      nameOnEvidence: true,
      category: "sports",
      hasMedia: true,
    }));
    assert.ok(trackWarnings("jupas", events).includes("overTenAwards"));
  });
});
