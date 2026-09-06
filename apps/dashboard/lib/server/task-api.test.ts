import { describe, expect, it } from "vitest";
import { createTask, enqueueResearch, transitionTask } from "./task-api";

const ids = {
  projectId: "018f0b21-4b4e-7c26-9f2f-0d15dc2f31f1",
  taskId: "018f0b21-4b4e-7c26-9f2f-0d15dc2f31f2",
  runId: "018f0b21-4b4e-7c26-9f2f-0d15dc2f31f3",
};

const task = {
  id: ids.taskId, projectId: ids.projectId, title: "Research", request: "Compare evidence", status: "backlog" as const, priority: "medium" as const,
  currentPhase: null, blockedReason: null, codexThreadId: null, skillName: "research-journalist", promptVersionId: null, skillVersionId: null,
  version: 0, createdAt: "2026-09-06T12:00:00.000Z", updatedAt: "2026-09-06T12:00:00.000Z", archivedAt: null,
};

describe("task API", () => {
  it("validates creates before invoking the store", async () => {
    let called = false;
    const response = await createTask(new Request("http://localhost", { method: "POST", body: "{" }), ids.projectId, { create: async () => { called = true; return task; } } as never);
    expect(response.status).toBe(400);
    expect(called).toBe(false);
  });

  it("requires a blocked reason and maps a successful transition", async () => {
    const invalid = await transitionTask(new Request("http://localhost", { method: "PATCH", body: JSON.stringify({ status: "blocked", version: 0 }) }), ids.taskId, {} as never);
    expect(invalid.status).toBe(400);
    const response = await transitionTask(new Request("http://localhost", { method: "PATCH", body: JSON.stringify({ status: "queued", version: 0 }) }), ids.taskId, { transition: async (_id: string, input: { status: typeof task.status; phase?: typeof task.currentPhase }) => ({ ...task, status: input.status, version: 1, currentPhase: input.phase ?? null }) } as never);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ data: { status: "queued", version: 1 } });
  });

  it("does not persist a run when the task is absent and reports queue failure", async () => {
    let runCreated = false;
    const missing = await enqueueResearch(ids.taskId, { get: async () => null } as never, { create: async () => { runCreated = true; return { id: ids.runId }; } } as never, {} as never);
    expect(missing.status).toBe(404);
    expect(runCreated).toBe(false);
    const response = await enqueueResearch(ids.taskId, { get: async () => task } as never, { create: async () => ({ id: ids.runId }), update: async () => ({ id: ids.runId }) } as never, { send: async () => null } as never);
    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({ error: { code: "internal_error" } });
  });
});
