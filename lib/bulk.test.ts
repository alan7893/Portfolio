import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bulkImportSchema } from "./validation";

describe("bulkImportSchema", () => {
  it("accepts one photo with only staged id and date", () => {
    const parsed = bulkImportSchema.parse({
      childId: "11111111-1111-4111-8111-111111111111",
      items: [
        {
          staged: "22222222-2222-4222-8222-222222222222",
          eventDate: "2020-06-15",
        },
      ],
    });
    assert.equal(parsed.items.length, 1);
    assert.equal(parsed.items[0]?.eventDate, "2020-06-15");
  });

  it("rejects more than 20 photos", () => {
    const items = Array.from({ length: 21 }, (_, i) => ({
      staged: "22222222-2222-4222-8222-222222222222",
      eventDate: "2026-01-01",
      title: `p${i}`,
    }));
    assert.equal(
      bulkImportSchema.safeParse({
        childId: "11111111-1111-4111-8111-111111111111",
        items,
      }).success,
      false,
    );
  });
});
