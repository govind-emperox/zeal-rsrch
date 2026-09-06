import type { Job, PgBoss } from "pg-boss";
import { type ResearchRunPayload, type RetentionCleanupPayload } from "@zeal-rsrch/contracts";
import { classifyFailure } from "@zeal-rsrch/domain";
import type { LocalStorage } from "@zeal-rsrch/storage";
import { assertQueuePayload, type QueueName } from "./queues.js";

type Repositories = {
  runs: { get(id: string): Promise<{ status: string; taskId: string; attempt: number } | null>; update(id: string, input: Record<string, unknown>): Promise<unknown> };
  tasks: { get(id: string): Promise<{ projectId: string; status: string; version: number } | null>; transition(id: string, input: Record<string, unknown>): Promise<unknown> };
  events: { append(input: Record<string, unknown>): Promise<unknown> };
  cleanupAudits: { create(input: Record<string, unknown>): Promise<unknown> };
};

export type ResearchExecutor = {
  run(payload: ResearchRunPayload, signal: AbortSignal): Promise<{ codexThreadId?: string }>;
  resume(payload: ResearchRunPayload & { codexThreadId: string }, signal: AbortSignal): Promise<{ codexThreadId?: string }>;
  cancel(taskId: string): Promise<void>;
};

export class ResearchWorker {
  private stopping = false;
  private readonly controller = new AbortController();

  constructor(
    private readonly boss: PgBoss,
    private readonly repositories: Repositories,
    private readonly executor: ResearchExecutor,
    private readonly storage: LocalStorage,
  ) {}

  async start(): Promise<void> {
    await Promise.all([
      this.boss.work("research.run", { batchSize: 1, heartbeatRefreshSeconds: 15 }, (jobs: Job[]) => this.handle("research.run", jobs)),
      this.boss.work("research.resume", { batchSize: 1, heartbeatRefreshSeconds: 15 }, (jobs: Job[]) => this.handle("research.resume", jobs)),
      this.boss.work("research.cancel", { batchSize: 1, heartbeatRefreshSeconds: 15 }, (jobs: Job[]) => this.handle("research.cancel", jobs)),
      this.boss.work("retention.cleanup", { batchSize: 1, heartbeatRefreshSeconds: 15 }, (jobs: Job[]) => this.handle("retention.cleanup", jobs)),
    ]);
  }

  async stop(): Promise<void> {
    this.stopping = true;
    this.controller.abort();
    await this.boss.stop({ graceful: true, timeout: 30_000 });
  }

  private async handle(queue: QueueName, jobs: readonly { data: unknown }[]): Promise<void> {
    for (const job of jobs) {
      if (this.stopping) return;
      assertQueuePayload(queue, job.data);
      if (queue === "research.run" || queue === "research.resume") await this.run(queue, job.data as ResearchRunPayload & { codexThreadId?: string });
      if (queue === "research.cancel") await this.cancel(job.data as { taskId: string; runId: string });
      if (queue === "retention.cleanup") await this.cleanup(job.data as RetentionCleanupPayload);
    }
  }

  private async run(queue: "research.run" | "research.resume", payload: ResearchRunPayload & { codexThreadId?: string }): Promise<void> {
    const run = await this.repositories.runs.get(payload.runId);
    const task = await this.repositories.tasks.get(payload.taskId);
    if (!run || !task || run.status === "completed" || run.status === "cancelled") return;
    await this.repositories.runs.update(payload.runId, { status: "running", startedAt: new Date() });
    await this.repositories.tasks.transition(payload.taskId, { expectedVersion: task.version, status: "researching", phase: "planning", runId: payload.runId, eventType: "planning_started", eventMessage: "Research execution started" });
    try {
      const result = queue === "research.run"
        ? await this.executor.run(payload, this.controller.signal)
        : await this.executor.resume(payload as ResearchRunPayload & { codexThreadId: string }, this.controller.signal);
      await this.repositories.runs.update(payload.runId, { status: "completed", codexThreadId: result.codexThreadId, finishedAt: new Date() });
    } catch (error) {
      const code = error instanceof Error && "code" in error && typeof error.code === "string" ? error.code : "unknown";
      const classification = classifyFailure(code as Parameters<typeof classifyFailure>[0]);
      await this.repositories.runs.update(payload.runId, { status: classification.disposition === "retry" ? "failed" : classification.disposition, terminalCode: code, finishedAt: new Date() });
      await this.repositories.events.append({ projectId: task.projectId, taskId: payload.taskId, runId: payload.runId, type: "task_failed", message: `Research execution failed: ${code}`, metadata: { retryable: classification.retryable } });
      throw error;
    }
  }

  private async cancel(payload: { taskId: string; runId: string }): Promise<void> {
    await this.executor.cancel(payload.taskId);
    await this.repositories.runs.update(payload.runId, { status: "cancelled", terminalCode: "cancelled", finishedAt: new Date() });
  }

  private async cleanup(payload: RetentionCleanupPayload): Promise<void> {
    const keys = await this.storage.list(payload.temporaryPrefix);
    const result = await this.storage.cleanupTemporary(keys.map((storageKey) => ({ storageKey, retentionClass: "temporary_scrape" as const, contentHash: "", sizeBytes: 0, contentType: "application/octet-stream" })));
    await this.repositories.cleanupAudits.create({ projectId: payload.projectId, taskId: payload.taskId, runId: payload.runId, status: result.failed.length ? "partial" : "complete", deletedItems: result.deleted, retainedItems: result.retained, failedItems: result.failed, startedAt: new Date(), finishedAt: new Date() });
  }
}
