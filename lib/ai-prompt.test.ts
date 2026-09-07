import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildAiMessages } from "./ai-prompt";

describe("buildAiMessages", () => {
  it("asks for Cantonese and refuses invented facts", () => {
    const { system, user } = buildAiMessages(
      {
        name: "陳小明",
        birthDate: "2017-05-04",
        school: "陽光小學",
        notes: null,
        events: [
          {
            title: "繪畫比賽冠軍",
            eventType: "PRIZE",
            eventDate: "2024-03-01",
            description: "色彩大膽",
            category: "arts",
            location: "文化中心",
            achievementRank: "冠軍",
            status: "COMPLETED",
            tags: ["藝術"],
          },
        ],
      },
      "portfolio",
      "zh-HK",
    );

    assert.match(system, /Cantonese/);
    assert.match(system, /do not invent/i);
    assert.match(user, /陳小明/);
    assert.match(user, /繪畫比賽冠軍/);
    assert.match(user, /冠軍/);
  });

  it("notes when a child has no events", () => {
    const { user } = buildAiMessages(
      {
        name: "Ada",
        birthDate: "2019-01-01",
        school: null,
        notes: null,
        events: [],
      },
      "memory",
      "en",
    );
    assert.match(user, /no events yet/);
    assert.match(user, /Ada/);
  });
});
