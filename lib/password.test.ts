import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateChangePassword } from "./password";

describe("validateChangePassword", () => {
  it("accepts a new 8-character password that matches confirmation", () => {
    assert.equal(
      validateChangePassword({
        currentPassword: "old-secret",
        newPassword: "alan1234",
        confirmPassword: "alan1234",
      }),
      null,
    );
  });

  it("rejects a short password", () => {
    assert.equal(
      validateChangePassword({
        currentPassword: "old-secret",
        newPassword: "short",
        confirmPassword: "short",
      }),
      "tooShort",
    );
  });

  it("rejects a confirmation mismatch", () => {
    assert.equal(
      validateChangePassword({
        currentPassword: "old-secret",
        newPassword: "alan1234",
        confirmPassword: "alan1235",
      }),
      "mismatch",
    );
  });

  it("rejects reusing the current password", () => {
    assert.equal(
      validateChangePassword({
        currentPassword: "alan1234",
        newPassword: "alan1234",
        confirmPassword: "alan1234",
      }),
      "unchanged",
    );
  });

  it("rejects a missing current password", () => {
    assert.equal(
      validateChangePassword({
        currentPassword: "",
        newPassword: "alan1234",
        confirmPassword: "alan1234",
      }),
      "missingCurrent",
    );
  });

  it("rejects a password over 200 characters", () => {
    const long = "a".repeat(201);
    assert.equal(
      validateChangePassword({
        currentPassword: "old-secret",
        newPassword: long,
        confirmPassword: long,
      }),
      "tooLong",
    );
  });
});
