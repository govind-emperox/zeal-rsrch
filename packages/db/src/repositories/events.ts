import { and, asc, eq, gt } from "drizzle-orm";
import type { BoundedMetadata, Correlation, RunEvent, RunEventType } from "@zeal-rsrch/contracts";
import type { Database } from "../client.js";
import { mapRunEvent } from "../mappers.js";
import { runEvents } from "../schema.js";

export type AppendRunEventInput = Correlation & {
  type: RunEventType;
  message: string;
  metadata?: BoundedMetadata;
};

export class RunEventRepository {
  constructor(private readonly db: Database) {}

  async append(input: AppendRunEventInput): Promise<RunEvent> {
    const [row] = await this.db
      .insert(runEvents)
      .values({
        projectId: input.projectId,
        taskId: input.taskId,
        runId: input.runId,
        jobId: input.jobId,
        codexThreadId: input.codexThreadId,
        codexTurnId: input.codexTurnId,
        traceId: input.traceId,
        skillVersion: input.skillVersion,
        promptVersion: input.promptVersion,
        model: input.model,
        applicationVersion: input.applicationVersion,
        type: input.type,
        message: input.message,
        metadata: input.metadata ?? {},
      })
      .returning();
    return mapRunEvent(row);
  }

  async listForTask(taskId: string, options: { afterId?: string; limit?: number } = {}): Promise<RunEvent[]> {
    const limit = Math.min(Math.max(options.limit ?? 100, 1), 500);
    const where = options.afterId
      ? and(eq(runEvents.taskId, taskId), gt(runEvents.id, BigInt(options.afterId)))
      : eq(runEvents.taskId, taskId);
    const rows = await this.db.select().from(runEvents).where(where).orderBy(asc(runEvents.id)).limit(limit);
    return rows.map(mapRunEvent);
  }
}
