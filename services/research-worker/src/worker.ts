import type { Job, PgBoss } from "pg-boss";
import { type ResearchRunPayload, type RetentionCleanupPayload } from "@zeal-rsrch/contracts";
import { classifyFailure } from "@zeal-rsrch/domain";
import type { LocalStorage } from "@zeal-rsrch/storage";
import { assertQueuePayload, type QueueName } from "./queues.js";

type Repositories = {
  runs: { get(id: string): Promise<{ status: string; taskId: string; attempt: number } | null>; update(id: string, input: Record<string, unknown>): Promise<unknown> };
  tasks: { get(id: string): Promise<{ projectId: string; status: string; version: number } | null>; transition(id: string, input: Record<string, unknown>): Promise<unknown> };
  events: { append(input: Record<string, unknown>): Promise<unknown> };
  files: { create(input: Record<string, unknown>): Promise<{ id: string }> };
  cleanupAudits: { create(input: Record<string, unknown>): Promise<unknown> };
};

export type ResearchExecutor = {
  run(payload: ResearchRunPayload, signal: AbortSignal): Promise<{ codexThreadId?: string; codexTurnId?: string }>;
  resume(payload: ResearchRunPayload & { codexThreadId: string }, signal: AbortSignal): Promise<{ codexThreadId?: string; codexTurnId?: string }>;
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
    let task = await this.repositories.tasks.get(payload.taskId);
    if (!run || !task || run.status === "completed" || run.status === "cancelled") return;
    await this.repositories.runs.update(payload.runId, { status: "running", startedAt: new Date() });
    if (task.status === "backlog" || task.status === "failed" || task.status === "cancelled") {
      await this.repositories.tasks.transition(payload.taskId, { expectedVersion: task.version, status: "queued", phase: "queued", runId: payload.runId, eventType: "task_queued", eventMessage: "Research execution queued" });
      task = await this.repositories.tasks.get(payload.taskId);
      if (!task) return;
    }
    if (task.status !== "researching") {
      await this.repositories.tasks.transition(payload.taskId, { expectedVersion: task.version, status: "researching", phase: "planning", runId: payload.runId, eventType: "planning_started", eventMessage: "Research execution started" });
    }
    try {
      const result = queue === "research.run"
        ? await this.executor.run(payload, this.controller.signal)
        : await this.executor.resume(payload as ResearchRunPayload & { codexThreadId: string }, this.controller.signal);
      await this.cleanup({
        projectId: task.projectId,
        taskId: payload.taskId,
        runId: payload.runId,
        idempotencyKey: `${payload.runId}:cleanup`,
        temporaryPrefix: `tmp/${payload.taskId}/`,
      });
      await this.repositories.runs.update(payload.runId, { status: "completed", codexThreadId: result.codexThreadId, codexTurnId: result.codexTurnId, finishedAt: new Date() });
      let current = await this.repositories.tasks.get(payload.taskId);
      if (current?.status === "researching") {
        await this.repositories.tasks.transition(payload.taskId, { expectedVersion: current.version, status: "drafting", phase: "drafting", runId: payload.runId, eventType: "draft_started", eventMessage: "Research report drafted" });
        current = await this.repositories.tasks.get(payload.taskId);
      }
      if (current?.status === "drafting") {
        await this.repositories.tasks.transition(payload.taskId, { expectedVersion: current.version, status: "review", phase: "complete", runId: payload.runId, eventType: "verification_started", eventMessage: "Research report is ready for review" });
      }
    } catch (error) {
      const code = error instanceof Error && "code" in error && typeof error.code === "string" ? error.code : "unknown";
      const classification = classifyFailure(code as Parameters<typeof classifyFailure>[0]);
      await this.repositories.runs.update(payload.runId, { status: classification.disposition === "retry" ? "failed" : classification.disposition, terminalCode: code, finishedAt: new Date() });
      const current = await this.repositories.tasks.get(payload.taskId);
      if (current) {
        const status = classification.disposition === "blocked" ? "blocked" : classification.disposition === "cancelled" ? "cancelled" : "failed";
        if (current.status !== status) {
          await this.repositories.tasks.transition(payload.taskId, {
            expectedVersion: current.version,
            status,
            phase: status === "blocked" ? "awaiting_approval" : null,
            blockedReason: status === "blocked" ? "Codex approval required" : null,
            runId: payload.runId,
            eventType: status === "blocked" ? "task_blocked" : status === "cancelled" ? "task_cancelled" : "task_failed",
            eventMessage: status === "cancelled" ? "Research execution cancelled" : `Research execution failed: ${code}`,
          });
        }
      }
      await this.repositories.events.append({ projectId: task.projectId, taskId: payload.taskId, runId: payload.runId, type: classification.disposition === "cancelled" ? "task_cancelled" : "task_failed", message: classification.disposition === "cancelled" ? "Research execution cancelled" : `Research execution failed: ${code}`, metadata: { retryable: classification.retryable } });
      if (classification.retryable) throw error;
    }
  }

  private async cancel(payload: { taskId: string; runId: string }): Promise<void> {
    await this.executor.cancel(payload.taskId);
    await this.repositories.runs.update(payload.runId, { status: "cancelled", terminalCode: "cancelled", finishedAt: new Date() });
    const task = await this.repositories.tasks.get(payload.taskId);
    if (task && task.status !== "cancelled") {
      await this.repositories.tasks.transition(payload.taskId, { expectedVersion: task.version, status: "cancelled", phase: null, runId: payload.runId, eventType: "task_cancelled", eventMessage: "Research execution cancelled" });
    }
  }

  private async cleanup(payload: RetentionCleanupPayload): Promise<void> {
    const keys = await this.storage.list(payload.temporaryPrefix);
    const result = await this.storage.cleanupTemporary(keys.map((storageKey) => ({ storageKey, retentionClass: "temporary_scrape" as const, contentHash: "", sizeBytes: 0, contentType: "application/octet-stream" })));
    const status = result.failed.length ? "partial" : "complete";
    const auditKey = `projects/${payload.projectId}/audits/${payload.runId}.json`;
    const auditObject = await this.storage.put(auditKey, `${JSON.stringify({ status, ...result }, null, 2)}\n`, "application/json");
    const auditFile = await this.repositories.files.create({ projectId: payload.projectId, taskId: payload.taskId, runId: payload.runId, kind: "audit", name: `${payload.runId}-cleanup.json`, ...auditObject, retentionClass: "cleanup_audit" });
    await this.repositories.cleanupAudits.create({ projectId: payload.projectId, taskId: payload.taskId, runId: payload.runId, auditFileId: auditFile.id, status, deletedItems: result.deleted, retainedItems: result.retained, failedItems: result.failed, startedAt: new Date(), finishedAt: new Date() });
    await this.repositories.events.append({ projectId: payload.projectId, taskId: payload.taskId, runId: payload.runId, type: "cleanup_completed", message: status === "complete" ? "Temporary research artifacts cleaned up" : "Research cleanup completed with failures", metadata: { deletedCount: result.deleted.length, failedCount: result.failed.length } });
  }
}
