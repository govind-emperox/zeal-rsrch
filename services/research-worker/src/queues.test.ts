import { describe, expect, it } from "vitest";
import { assertQueuePayload, createQueues, enqueue, QUEUES } from "./queues.js";

const envelope = { taskId: "decf74f8-9038-460b-a83f-fd5ba9a2bed6", runId: "d0f70d25-49b9-4142-a04f-68f7707dc37f", idempotencyKey: "a".repeat(16) };

describe("queue payloads", () => {
  it("accepts only the declared queue payload shape", () => {
    expect(() => assertQueuePayload("research.run", { ...envelope, promptVersionId: envelope.taskId, skillVersionId: envelope.runId })).not.toThrow();
    expect(() => assertQueuePayload("retention.cleanup", { ...envelope, projectId: envelope.taskId, temporaryPrefix: "tmp/not-a-uuid/" })).toThrow();
  });

  it("creates every declared queue with retry policy", async () => {
    const calls: unknown[][] = [];
    const boss = { createQueue: async (...args: unknown[]) => { calls.push(args); } };

    await createQueues(boss as never);

    expect(calls).toEqual(QUEUES.map((queue) => [queue, { retryLimit: 3, retryDelay: 5, expireInHours: 2 }]));
  });

  it("rejects invalid jobs and a queue that cannot return a job ID", async () => {
    const boss = { send: async () => null };
    await expect(enqueue(boss as never, "research.run", { ...envelope, promptVersionId: envelope.taskId, skillVersionId: envelope.runId })).rejects.toThrow("Unable to enqueue research.run");
    await expect(enqueue(boss as never, "research.run", { taskId: "invalid" })).rejects.toThrow();
  });
});
