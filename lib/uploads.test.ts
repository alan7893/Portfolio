import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import {
  collectUploadedFiles,
  collectStagedIds,
  stageUploadedFile,
  attachStagedFiles,
  resolveStoredFile,
  filenameStem,
  isSafeId,
} from "./uploads";

function jpegStub(name = "park.jpg"): {
  name: string;
  type: string;
  size: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
} {
  const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xd9, 1, 2, 3, 4]);
  return {
    name,
    type: "image/jpeg",
    size: bytes.byteLength,
    arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  };
}

describe("upload staging", () => {
  let tmp = "";

  before(async () => {
    tmp = await mkdtemp(path.join(os.tmpdir(), "kp-upload-"));
    process.env.UPLOAD_DIR = tmp;
  });

  after(async () => {
    if (tmp) await rm(tmp, { recursive: true, force: true });
  });

  it("collects blobs from FormData without requiring instanceof File", () => {
    const fd = new FormData();
    fd.append("files", new File([new Uint8Array([1, 2, 3, 4])], "a.jpg", { type: "image/jpeg" }));
    fd.append("files", "ignore-me");
    const files = collectUploadedFiles(fd);
    assert.equal(files.length, 1);
    assert.equal(files[0].name, "a.jpg");
    assert.equal(files[0].type, "image/jpeg");
    assert.equal(files[0].size, 4);
  });

  it("collects only UUID staged ids", () => {
    const fd = new FormData();
    fd.append("staged", "11111111-1111-4111-8111-111111111111");
    fd.append("staged", "../etc/passwd");
    fd.append("staged", "11111111-1111-4111-8111-111111111111");
    const ids = collectStagedIds(fd);
    assert.deepEqual(ids, ["11111111-1111-4111-8111-111111111111"]);
    assert.equal(isSafeId("../oops"), false);
  });

  it("stages a photo then attaches it under the event folder", async () => {
    const staged = await stageUploadedFile(jpegStub(), "user-1");
    assert.ok(isSafeId(staged.id));
    const saved = await attachStagedFiles(
      [staged.id],
      "user-1",
      "child-a",
      "event-b",
    );
    assert.equal(saved.length, 1);
    assert.equal(saved[0].originalName, "park.jpg");
    assert.equal(saved[0].fileType, "image/jpeg");
    const abs = resolveStoredFile(saved[0].filePath);
    assert.ok(abs);
    const bytes = await readFile(abs);
    assert.equal(bytes.length, 8);
    assert.equal(filenameStem("park.jpg"), "park");
  });

  it("does not attach another user's staged file", async () => {
    const staged = await stageUploadedFile(jpegStub("secret.jpg"), "owner");
    const saved = await attachStagedFiles(
      [staged.id],
      "intruder",
      "child-a",
      "event-c",
    );
    assert.equal(saved.length, 0);
  });

  it("ignores path-traversal staged ids", async () => {
    const saved = await attachStagedFiles(
      ["../etc/passwd"],
      "user-1",
      "child-a",
      "event-d",
    );
    assert.equal(saved.length, 0);
  });
});
