import { createHash, randomUUID } from "node:crypto";
import { mkdir, readdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";
import type { RetentionClass } from "@zeal-rsrch/contracts";
import { shouldRetain } from "@zeal-rsrch/domain";

export type StoredArtifact = {
  storageKey: string;
  contentHash: string;
  sizeBytes: number;
  contentType: string;
};

export type StoredObject = StoredArtifact & { retentionClass: RetentionClass };

const MAX_PREVIEW_BYTES = 128 * 1024;
const SAFE_KEY = /^(?:projects\/[a-zA-Z0-9][a-zA-Z0-9._-]{0,254}\/(?:reports|manifests|audits|uploads)\/[a-zA-Z0-9][a-zA-Z0-9._-]{0,254}|tmp\/[a-zA-Z0-9][a-zA-Z0-9._-]{0,254}\/[a-zA-Z0-9][a-zA-Z0-9._-]{0,254})$/;

export class UnsafeStorageKeyError extends Error {
  constructor(key: string) {
    super(`Unsafe storage key: ${JSON.stringify(key)}`);
    this.name = "UnsafeStorageKeyError";
  }
}

function assertSafeKey(key: string): void {
  if (!SAFE_KEY.test(key)) {
    throw new UnsafeStorageKeyError(key);
  }
}

function isWithinRoot(root: string, filePath: string): boolean {
  const path = relative(root, filePath);
  return path !== "" && !path.startsWith(`..${sep}`) && path !== "..";
}

export class LocalStorage {
  private readonly root: string;

  constructor(root: string) {
    this.root = resolve(root);
  }

  async put(
    storageKey: string,
    content: Uint8Array | string,
    contentType: string,
  ): Promise<StoredArtifact> {
    assertSafeKey(storageKey);
    const target = resolve(this.root, storageKey);
    if (!isWithinRoot(this.root, target)) {
      throw new UnsafeStorageKeyError(storageKey);
    }
    const bytes = typeof content === "string" ? Buffer.from(content) : Buffer.from(content);
    const contentHash = createHash("sha256").update(bytes).digest("hex");
    await mkdir(dirname(target), { recursive: true });
    const temporary = `${target}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporary, bytes, { flag: "wx" });
      await rename(temporary, target);
    } finally {
      await rm(temporary, { force: true });
    }
    return { storageKey, contentHash, sizeBytes: bytes.byteLength, contentType };
  }

  async get(storageKey: string): Promise<Buffer> {
    assertSafeKey(storageKey);
    return readFile(resolve(this.root, storageKey));
  }

  async preview(storageKey: string, maximumBytes = MAX_PREVIEW_BYTES): Promise<{ content: string; truncated: boolean }> {
    const bytes = await this.get(storageKey);
    const limit = Math.min(Math.max(maximumBytes, 1), MAX_PREVIEW_BYTES);
    return { content: bytes.subarray(0, limit).toString("utf8"), truncated: bytes.byteLength > limit };
  }

  async list(prefix: string): Promise<string[]> {
    if (!/^tmp\/[a-zA-Z0-9][a-zA-Z0-9._-]{0,254}\/$/.test(prefix)) {
      throw new UnsafeStorageKeyError(prefix);
    }
    const directory = resolve(this.root, prefix);
    if (!isWithinRoot(this.root, directory)) {
      throw new UnsafeStorageKeyError(prefix);
    }
    try {
      const entries = await readdir(directory, { recursive: true, withFileTypes: true });
      return entries
        .filter((entry) => entry.isFile())
        .map((entry) => `${prefix}${entry.parentPath.slice(directory.length + 1)}/${entry.name}`.replace(/\/+/g, "/").replace(/\/\//g, "/"));
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") return [];
      throw error;
    }
  }

  async cleanupTemporary(objects: readonly StoredObject[]): Promise<{ deleted: string[]; retained: string[]; failed: string[] }> {
    const deleted: string[] = [];
    const retained: string[] = [];
    const failed: string[] = [];
    for (const object of objects) {
      if (shouldRetain(object.retentionClass)) {
        retained.push(object.storageKey);
        continue;
      }
      try {
        assertSafeKey(object.storageKey);
        await rm(resolve(this.root, object.storageKey), { force: true });
        deleted.push(object.storageKey);
      } catch {
        failed.push(object.storageKey);
      }
    }
    return { deleted, retained, failed };
  }

  async exists(storageKey: string): Promise<boolean> {
    try {
      assertSafeKey(storageKey);
      await stat(resolve(this.root, storageKey));
      return true;
    } catch {
      return false;
    }
  }
}
