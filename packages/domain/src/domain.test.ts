import { describe, expect, it } from "vitest";
import {
  InvalidArtifactKeySegmentError,
  InvalidTaskTransitionError,
  assertTaskTransition,
  buildResearchPrompt,
  canTransitionTask,
  classifyFailure,
  partitionRetention,
  projectArtifactKey,
  shouldDeleteAfterRun,
  shouldRetain,
  temporaryTaskPrefix,
} from "./index.js";

describe("task state machine", () => {
  it("allows normal execution and retry transitions", () => {
    expect(canTransitionTask("backlog", "queued")).toBe(true);
    expect(canTransitionTask("researching", "drafting")).toBe(true);
    expect(canTransitionTask("failed", "queued")).toBe(true);
    expect(canTransitionTask("done", "review")).toBe(true);
  });

  it("rejects skipped and post-archive transitions", () => {
    expect(() => assertTaskTransition("backlog", "done")).toThrow(InvalidTaskTransitionError);
    expect(() => assertTaskTransition("archived", "queued")).toThrow(InvalidTaskTransitionError);
  });
});

describe("retry classification", () => {
  it("retries transient infrastructure failures", () => {
    expect(classifyFailure("codex_unavailable")).toMatchObject({
      disposition: "retry",
      retryable: true,
    });
  });

  it("blocks approval requests without automatic retry", () => {
    expect(classifyFailure("approval_required")).toEqual({
      disposition: "blocked",
      retryable: false,
      retryAfterMs: null,
    });
  });

  it("does not retry invalid requests or denied approvals", () => {
    expect(classifyFailure("invalid_request").retryable).toBe(false);
    expect(classifyFailure("approval_denied").retryable).toBe(false);
  });
});

describe("retention policy", () => {
  it("retains final products and removes temporary source material", () => {
    expect(shouldRetain("final_report")).toBe(true);
    expect(shouldRetain("cleanup_audit")).toBe(true);
    expect(shouldDeleteAfterRun("temporary_scrape")).toBe(true);
    expect(shouldDeleteAfterRun("temporary_notes")).toBe(true);
  });

  it("partitions artifacts for cleanup", () => {
    const result = partitionRetention([
      { name: "report", retentionClass: "final_report" as const },
      { name: "raw", retentionClass: "temporary_scrape" as const },
    ]);

    expect(result.retain.map((item) => item.name)).toEqual(["report"]);
    expect(result.remove.map((item) => item.name)).toEqual(["raw"]);
  });
});

describe("artifact keys", () => {
  it("builds stable logical keys", () => {
    expect(projectArtifactKey("project-123", "reports", "report.md")).toBe(
      "projects/project-123/reports/report.md",
    );
    expect(temporaryTaskPrefix("task-123")).toBe("tmp/task-123/");
  });

  it("rejects path traversal and nested file names", () => {
    expect(() => projectArtifactKey("../project", "reports", "report.md")).toThrow(
      InvalidArtifactKeySegmentError,
    );
    expect(() => projectArtifactKey("project", "reports", "nested/report.md")).toThrow(
      InvalidArtifactKeySegmentError,
    );
  });
});

describe("research prompt", () => {
  it("wraps the request with skill, project, and retention context", () => {
    const prompt = buildResearchPrompt({
      projectTitle: "Evidence review",
      taskTitle: "Compare claims",
      request: "Read the primary sources and explain the disagreement.",
    });

    expect(prompt.startsWith("$research-journalist\n")).toBe(true);
    expect(prompt).toContain("Project: Evidence review");
    expect(prompt).toContain("Task: Compare claims");
    expect(prompt).toContain("Delete temporary scrape output");
    expect(prompt).toContain("Do not put raw source bodies or secrets in events");
  });

  it("keeps untrusted title newlines out of prompt headings", () => {
    const prompt = buildResearchPrompt({
      projectTitle: "Evidence\nreview",
      taskTitle: "Compare\tclaims",
      request: "Check the sources.",
    });

    expect(prompt).toContain("Project: Evidence review");
    expect(prompt).toContain("Task: Compare claims");
  });

  it("rejects unsafe skill names", () => {
    expect(() =>
      buildResearchPrompt({
        projectTitle: "Project",
        taskTitle: "Task",
        request: "Request",
        skillName: "../other-skill",
      }),
    ).toThrow("Invalid skill name");
  });
});
