import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { LocalStorage, UnsafeStorageKeyError } from "./local-storage.js";

const roots: string[] = [];

async function storage(): Promise<LocalStorage> {
  const root = await mkdtemp(join(tmpdir(), "rsrch-storage-"));
  roots.push(root);
  return new LocalStorage(root);
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("LocalStorage", () => {
  it("writes atomically and returns a sha256 hash", async () => {
    const subject = await storage();
    const artifact = await subject.put("projects/project-1/reports/report.md", "hello", "text/markdown");

    expect(artifact).toMatchObject({ sizeBytes: 5, contentHash: "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824" });
    await expect(subject.get(artifact.storageKey)).resolves.toEqual(Buffer.from("hello"));
  });

  it("rejects traversal keys and protects retained artifacts during cleanup", async () => {
    const subject = await storage();
    await expect(subject.put("../report.md", "no", "text/plain")).rejects.toBeInstanceOf(UnsafeStorageKeyError);
    await subject.put("tmp/task-1/scrape.txt", "temporary", "text/plain");
    await subject.put("projects/project-1/reports/report.md", "final", "text/markdown");

    await expect(subject.cleanupTemporary([
      { storageKey: "tmp/task-1/scrape.txt", retentionClass: "temporary_scrape", contentHash: "", sizeBytes: 9, contentType: "text/plain" },
      { storageKey: "projects/project-1/reports/report.md", retentionClass: "final_report", contentHash: "", sizeBytes: 5, contentType: "text/markdown" },
    ])).resolves.toEqual({ deleted: ["tmp/task-1/scrape.txt"], retained: ["projects/project-1/reports/report.md"], failed: [] });
  });

  it("bounds previews and reports truncation without exposing data outside the object", async () => {
    const subject = await storage();
    await subject.put("tmp/task-1/preview.txt", "abcdefgh", "text/plain");

    await expect(subject.preview("tmp/task-1/preview.txt", 4)).resolves.toEqual({ content: "abcd", truncated: true });
    await expect(subject.preview("../secret", 4)).rejects.toBeInstanceOf(UnsafeStorageKeyError);
  });
});
