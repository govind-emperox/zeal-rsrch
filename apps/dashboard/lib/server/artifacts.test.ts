import { beforeEach, describe, expect, it, vi } from "vitest";

const get = vi.fn();
const preview = vi.fn();
const cleanupTemporary = vi.fn();

vi.mock("@zeal-rsrch/storage", () => ({ LocalStorage: class { get = get; preview = preview; cleanupTemporary = cleanupTemporary; } }));

import { deleteArtifact, previewArtifact } from "./artifacts";

const artifact = {
  id: "018f0b21-4b4e-7c26-9f2f-0d15dc2f31f1", projectId: "018f0b21-4b4e-7c26-9f2f-0d15dc2f31f2", taskId: null, runId: null,
  kind: "report" as const, name: "report.md", storageKey: "projects/project-1/reports/report.md", contentType: "text/markdown", contentHash: "a".repeat(64),
  sizeBytes: 6, retentionClass: "final_report" as const, createdAt: "2026-09-06T12:00:00.000Z", updatedAt: "2026-09-06T12:00:00.000Z", deletedAt: null,
};

describe("artifact API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not load non-text content for previews", async () => {
    const response = await previewArtifact(artifact.id, { get: async () => ({ ...artifact, contentType: "application/pdf" }) } as never);
    expect(response.status).toBe(415);
    expect(get).not.toHaveBeenCalled();
    expect(preview).not.toHaveBeenCalled();
  });

  it("protects retained artifacts from deletion without touching storage", async () => {
    const markDeleted = vi.fn();
    const response = await deleteArtifact(artifact.id, { get: async () => artifact, markDeleted } as never);
    expect(response.status).toBe(409);
    expect(cleanupTemporary).not.toHaveBeenCalled();
    expect(markDeleted).not.toHaveBeenCalled();
  });
});
