import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { datePartsUtc, formatYmd, parseDateOnly, todayDateOnly } from "./dates";
import { formatDate, monthLabel } from "./format";
import { getDictionary } from "./i18n";

describe("date-only helpers", () => {
  it("parses YYYY-MM-DD as UTC midnight so the calendar day does not shift", () => {
    const dt = parseDateOnly("2020-06-15");
    assert.ok(dt);
    assert.equal(dt.toISOString(), "2020-06-15T00:00:00.000Z");
    assert.deepEqual(datePartsUtc(dt), { year: 2020, month: 6, day: 15 });
    assert.equal(formatYmd(dt), "2020-06-15");
  });

  it("rejects impossible calendar days", () => {
    assert.equal(parseDateOnly("2020-02-30"), null);
    assert.equal(parseDateOnly("15/6/2020"), null);
  });

  it("uses the local calendar day for today", () => {
    const now = new Date(2026, 8, 11, 1, 0, 0);
    assert.equal(todayDateOnly(now), "2026-09-11");
  });
});

describe("formatDate", () => {
  const zh = getDictionary("zh-HK");
  const en = getDictionary("en");

  it("uses numeric year-month-day in Cantonese, not 六月 mixed with 15", () => {
    assert.equal(formatDate("2020-06-15", "zh-HK", zh), "2020年6月15日");
    assert.equal(formatDate("2020-01-03", "zh-HK", zh), "2020年1月3日");
  });

  it("uses the same calendar day in English", () => {
    assert.equal(formatDate("2020-06-15", "en", en), "15 Jun 2020");
  });

  it("uses numeric month headers on the timeline", () => {
    assert.equal(monthLabel(5, "zh-HK", zh), "6月");
    assert.equal(monthLabel(5, "en", en), "Jun");
  });
});
