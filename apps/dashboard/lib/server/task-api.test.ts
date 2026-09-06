import { describe, expect, it } from "vitest";
import { cancelResearch, createTask, enqueueResearch, transitionTask } from "./task-api";

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

  it("queues task state before publishing a new research job", async () => {
    const calls: string[] = [];
    const queuedTask = { ...task, status: "queued" as const, currentPhase: "queued" as const, version: 1 };
    const response = await enqueueResearch(
      ids.taskId,
      {
        get: async () => task,
        transition: async () => { calls.push("transition"); return queuedTask; },
      } as never,
      {
        create: async () => { calls.push("run"); return { id: ids.runId }; },
        update: async () => ({ id: ids.runId }),
      } as never,
      {
        send: async (queue: string, payload: Record<string, unknown>) => {
          calls.push(queue);
          expect(payload).toMatchObject({ taskId: ids.taskId, promptVersionId: null, skillVersionId: null });
          return "job-1";
        },
      } as never,
    );
    expect(response.status).toBe(202);
    expect(calls).toEqual(["transition", "run", "research.run"]);
  });

  it("publishes resume and cancel jobs for an existing Codex thread", async () => {
    const resumed = { ...task, status: "queued" as const, currentPhase: "queued" as const, codexThreadId: "thread-1", version: 2 };
    const queues: string[] = [];
    const boss = { send: async (queue: string) => { queues.push(queue); return `job-${queue}`; } } as never;
    const start = await enqueueResearch(ids.taskId, { get: async () => resumed } as never, { create: async () => ({ id: ids.runId }), update: async () => ({ id: ids.runId }) } as never, boss);
    const cancel = await cancelResearch(ids.taskId, { get: async () => resumed } as never, { listForTask: async () => [{ id: ids.runId, status: "running" }] } as never, boss);
    expect(start.status).toBe(202);
    expect(cancel.status).toBe(202);
    expect(queues).toEqual(["research.resume", "research.cancel"]);
  });
});
