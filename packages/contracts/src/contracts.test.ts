import { describe, expect, it } from "vitest";
import {
  BoundedMetadataSchema,
  CreateProjectInputSchema,
  CreateTaskInputSchema,
  RetentionCleanupPayloadSchema,
  RunEventSchema,
  SourceSchema,
  StorageKeySchema,
} from "./index.js";

const id = "018f0b21-4b4e-7c26-9f2f-0d15dc2f31f1";

describe("contract boundaries", () => {
  it("normalizes project input", () => {
    expect(CreateProjectInputSchema.parse({ title: "  Source review  " })).toEqual({
      title: "Source review",
    });
  });

  it("applies safe task defaults", () => {
    const task = CreateTaskInputSchema.parse({
      projectId: id,
      title: "Map evidence",
      request: "Compare the primary sources.",
    });

    expect(task.priority).toBe("medium");
    expect(task.skillName).toBe("research-journalist");
  });

  it("rejects absolute and traversing storage keys", () => {
    expect(StorageKeySchema.safeParse("/etc/passwd").success).toBe(false);
    expect(StorageKeySchema.safeParse("tmp/task/../../secret").success).toBe(false);
    expect(StorageKeySchema.safeParse("tmp//report.md").success).toBe(false);
    expect(StorageKeySchema.safeParse("tmp\\report.md").success).toBe(false);
  });

  it("bounds normalized event metadata", () => {
    expect(BoundedMetadataSchema.safeParse({ body: "x".repeat(17_000) }).success).toBe(false);
  });

  it("validates normalized run events", () => {
    const parsed = RunEventSchema.parse({
      id: 1,
      projectId: id,
      taskId: id,
      runId: id,
      type: "planning_started",
      message: "Planning sources",
      metadata: {},
      createdAt: "2026-09-05T12:00:00-05:00",
    });

    expect(parsed.type).toBe("planning_started");
    expect(parsed.id).toBe("1");
  });

  it("preserves large ordered event IDs as strings", () => {
    const parsed = RunEventSchema.parse({
      id: "9223372036854775807",
      projectId: id,
      taskId: id,
      type: "task_created",
      message: "Task created",
      metadata: {},
      createdAt: "2026-09-05T12:00:00-05:00",
    });

    expect(parsed.id).toBe("9223372036854775807");
  });

  it("accepts only HTTP(S) source URLs", () => {
    const source = {
      id,
      taskId: id,
      runId: id,
      type: "webpage",
      title: "Primary source",
      publisher: null,
      author: null,
      publishedAt: null,
      retrievedAt: "2026-09-05T12:00:00-05:00",
      accessStatus: "available",
    };

    expect(SourceSchema.safeParse({ ...source, url: "https://example.com/source" }).success).toBe(true);
    expect(SourceSchema.safeParse({ ...source, url: "file:///etc/passwd" }).success).toBe(false);
  });

  it("rejects cleanup outside the task temporary prefix", () => {
    expect(
      RetentionCleanupPayloadSchema.safeParse({
        projectId: id,
        taskId: id,
        runId: id,
        idempotencyKey: "cleanup:018f0b21-4b4e-7c26",
        temporaryPrefix: "projects/example/reports/",
      }).success,
    ).toBe(false);
  });
});
