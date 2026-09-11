import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  dateFromCameraOrToday,
  isSavableItem,
  isUploadBusy,
  keepCameraDate,
} from "./bulk-flow";

describe("bulk-flow", () => {
  it("lets a staged photo be saved while AI is still reading it", () => {
    assert.equal(isUploadBusy("captioning"), false);
    assert.equal(
      isSavableItem({ skipped: false, stagedId: "abc", status: "captioning" }),
      true,
    );
    assert.equal(
      isSavableItem({ skipped: false, stagedId: "abc", status: "uploaded" }),
      true,
    );
    assert.equal(
      isSavableItem({ skipped: false, stagedId: "", status: "uploading" }),
      false,
    );
  });

  it("keeps the camera date even if a later step has no date", () => {
    const kept = keepCameraDate(
      { suggestedDate: "2020-06-15", dateFromPhoto: true },
      null,
    );
    assert.deepEqual(kept, { suggestedDate: "2020-06-15", dateFromPhoto: true });
  });

  it("fills the camera date when EXIF arrives after a today fallback", () => {
    const next = keepCameraDate(
      { suggestedDate: "2026-09-11", dateFromPhoto: false },
      "2018-12-01",
    );
    assert.deepEqual(next, { suggestedDate: "2018-12-01", dateFromPhoto: true });
  });

  it("uses the photo taken date instead of today when present", () => {
    assert.deepEqual(dateFromCameraOrToday("2019-03-04", "2026-09-11"), {
      suggestedDate: "2019-03-04",
      dateFromPhoto: true,
    });
    assert.deepEqual(dateFromCameraOrToday(null, "2026-09-11"), {
      suggestedDate: "2026-09-11",
      dateFromPhoto: false,
    });
  });
});
