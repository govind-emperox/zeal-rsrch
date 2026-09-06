import { describe, expect, it } from "vitest";
import { ResearchWorker } from "./worker.js";

type WorkerInternals = {
  run(queue: "research.run" | "research.resume", payload: Record<string, string>): Promise<void>;
  cleanup(payload: Record<string, string>): Promise<void>;
};

const ids = {
  projectId: "018f0b21-4b4e-7c26-9f2f-0d15dc2f31f1",
  taskId: "018f0b21-4b4e-7c26-9f2f-0d15dc2f31f2",
  runId: "018f0b21-4b4e-7c26-9f2f-0d15dc2f31f3",
};

function subject(overrides: { run?: () => Promise<unknown>; list?: () => Promise<string[]> } = {}) {
  const updates: Record<string, unknown>[] = [];
  const events: Record<string, unknown>[] = [];
  const audits: Record<string, unknown>[] = [];
  const worker = new ResearchWorker(
    { stop: async () => {}, work: async () => {} } as never,
    {
      runs: { get: async () => ({ status: "queued", taskId: ids.taskId, attempt: 0 }), update: async (_id, input) => { updates.push(input); } },
      tasks: { get: async () => ({ projectId: ids.projectId, status: "queued", version: 2 }), transition: async () => {} },
      events: { append: async (input) => { events.push(input); } },
      cleanupAudits: { create: async (input) => { audits.push(input); } },
    },
    { run: async () => overrides.run?.() as { codexThreadId?: string }, resume: async () => ({}), cancel: async () => {} },
    { list: async () => overrides.list?.() ?? [], cleanupTemporary: async () => ({ deleted: ["tmp/x/a"], retained: [], failed: [] }) } as never,
  );
  return { worker, updates, events, audits };
}

describe("ResearchWorker", () => {
  it("records a retryable executor failure without raw error content", async () => {
    const { worker, updates, events } = subject({ run: async () => { throw Object.assign(new Error("token=super-secret"), { code: "network_error" }); } });
    const payload = { ...ids, idempotencyKey: "a".repeat(16), promptVersionId: ids.taskId, skillVersionId: ids.runId };

    await expect((worker as unknown as WorkerInternals).run("research.run", payload)).rejects.toMatchObject({ code: "network_error" });
    expect(updates).toContainEqual(expect.objectContaining({ status: "failed", terminalCode: "network_error" }));
    expect(events).toEqual([expect.objectContaining({ message: "Research execution failed: network_error", metadata: { retryable: false } })]);
    expect(JSON.stringify(events)).not.toContain("super-secret");
  });

  it("records cleanup results from storage", async () => {
    const { worker, audits } = subject({ list: async () => ["tmp/task-1/scrape.txt"] });
    const payload = { ...ids, idempotencyKey: "b".repeat(16), temporaryPrefix: "tmp/018f0b21-4b4e-7c26-9f2f-0d15dc2f31f2/" };

    await (worker as unknown as WorkerInternals).cleanup(payload);

    expect(audits).toEqual([expect.objectContaining({ status: "complete", deletedItems: ["tmp/x/a"], failedItems: [] })]);
  });
});
