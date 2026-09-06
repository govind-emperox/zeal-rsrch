import { and, desc, eq, sql } from "drizzle-orm";
import type { CreateTaskInput, RunEventType, Task, TaskPhase, TaskStatus } from "@zeal-rsrch/contracts";
import { assertTaskTransition } from "@zeal-rsrch/domain";
import type { Database } from "../client.js";
import {
  ArchivedProjectError,
  BlockedReasonRequiredError,
  OptimisticLockError,
  RecordNotFoundError,
} from "../errors.js";
import { mapTask } from "../mappers.js";
import { projects, runEvents, tasks } from "../schema.js";

export type TransitionTaskInput = {
  expectedVersion: number;
  status: TaskStatus;
  phase?: TaskPhase | null;
  blockedReason?: string | null;
  runId?: string | null;
  eventType: RunEventType;
  eventMessage: string;
};

export class TaskRepository {
  constructor(private readonly db: Database) {}

  async create(input: CreateTaskInput): Promise<Task> {
    return this.db.transaction(async (transaction) => {
      const [project] = await transaction
        .select({ id: projects.id, status: projects.status })
        .from(projects)
        .where(eq(projects.id, input.projectId))
        .for("share")
        .limit(1);
      if (!project) {
        throw new RecordNotFoundError("Project", input.projectId);
      }
      if (project.status === "archived") {
        throw new ArchivedProjectError(input.projectId);
      }

      const [task] = await transaction
        .insert(tasks)
        .values({
          projectId: input.projectId,
          title: input.title,
          request: input.request,
          priority: input.priority,
          skillName: input.skillName,
        })
        .returning();
      await transaction.insert(runEvents).values({
        projectId: input.projectId,
        taskId: task.id,
        type: "task_created",
        message: "Task created",
        metadata: { priority: task.priority, skillName: task.skillName },
      });
      return mapTask(task);
    });
  }

  async get(id: string): Promise<Task | null> {
    const [row] = await this.db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
    return row ? mapTask(row) : null;
  }

  async listForProject(projectId: string, options: { limit?: number } = {}): Promise<Task[]> {
    const limit = Math.min(Math.max(options.limit ?? 100, 1), 200);
    const rows = await this.db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, projectId))
      .orderBy(desc(tasks.updatedAt))
      .limit(limit);
    return rows.map(mapTask);
  }

  async transition(id: string, input: TransitionTaskInput): Promise<Task> {
    return this.db.transaction(async (transaction) => {
      const [current] = await transaction.select().from(tasks).where(eq(tasks.id, id)).for("update").limit(1);
      if (!current) {
        throw new RecordNotFoundError("Task", id);
      }
      if (current.version !== input.expectedVersion) {
        throw new OptimisticLockError("Task", id, input.expectedVersion);
      }
      assertTaskTransition(current.status, input.status);
      if (input.status === "blocked" && !(input.blockedReason ?? current.blockedReason)?.trim()) {
        throw new BlockedReasonRequiredError(id);
      }

      const [updated] = await transaction
        .update(tasks)
        .set({
          status: input.status,
          currentPhase: input.status === "archived" ? null : input.phase,
          blockedReason: input.status === "blocked" ? input.blockedReason ?? current.blockedReason : null,
          archivedAt: input.status === "archived" ? new Date() : current.archivedAt,
          updatedAt: new Date(),
          version: sql`${tasks.version} + 1`,
        })
        .where(and(eq(tasks.id, id), eq(tasks.version, input.expectedVersion)))
        .returning();
      if (!updated) {
        throw new OptimisticLockError("Task", id, input.expectedVersion);
      }

      await transaction.insert(runEvents).values({
        projectId: updated.projectId,
        taskId: updated.id,
        runId: input.runId,
        codexThreadId: updated.codexThreadId,
        type: input.eventType,
        message: input.eventMessage,
        metadata: { from: current.status, to: updated.status, phase: updated.currentPhase },
      });
      return mapTask(updated);
    });
  }

  async updateCodexThread(id: string, codexThreadId: string): Promise<void> {
    const result = await this.db
      .update(tasks)
      .set({ codexThreadId, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning({ id: tasks.id });
    if (result.length === 0) {
      throw new RecordNotFoundError("Task", id);
    }
  }
}
