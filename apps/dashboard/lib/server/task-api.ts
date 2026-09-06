import { randomUUID } from "node:crypto";
import { PgBoss } from "pg-boss";
import { ZodError } from "zod";
import {
  CreateTaskInputSchema,
  ProjectIdParamsSchema,
  TaskSchema,
  TransitionTaskInputSchema,
  type CreateTaskInput,
  type ResearchRun,
  type Task,
} from "@zeal-rsrch/contracts";
import { ArchivedProjectError, BlockedReasonRequiredError, OptimisticLockError, RecordNotFoundError } from "@zeal-rsrch/db";
import { InvalidTaskTransitionError } from "@zeal-rsrch/domain";

export type TaskStore = {
  create(input: CreateTaskInput): Promise<Task>;
  get(id: string): Promise<Task | null>;
  listForProject(projectId: string, options?: { limit?: number }): Promise<Task[]>;
  transition(id: string, input: {
    expectedVersion: number;
    status: Task["status"];
    phase?: Task["currentPhase"];
    blockedReason?: string | null;
    eventType: "task_queued" | "task_blocked" | "task_completed" | "task_cancelled";
    eventMessage: string;
  }): Promise<Task>;
};

export type RunStore = {
  create(input: { taskId: string }): Promise<ResearchRun>;
  update(id: string, input: { jobId: string }): Promise<ResearchRun>;
};

function errorResponse(status: number, code: string, message: string): Response {
  return Response.json({ error: { code, message } }, { status });
}

function handledError(error: unknown): Response {
  if (error instanceof ZodError) return errorResponse(400, "validation_error", "Request validation failed");
  if (error instanceof RecordNotFoundError || (error instanceof Error && error.name === "RecordNotFoundError")) {
    return errorResponse(404, "not_found", "The requested project or task was not found");
  }
  if (error instanceof ArchivedProjectError || (error instanceof Error && error.name === "ArchivedProjectError")) {
    return errorResponse(409, "project_archived", "Tasks cannot be created in an archived project");
  }
  if (error instanceof OptimisticLockError || (error instanceof Error && error.name === "OptimisticLockError")) {
    return errorResponse(409, "version_conflict", "Task changed; reload it and try again");
  }
  if (error instanceof InvalidTaskTransitionError || (error instanceof Error && error.name === "InvalidTaskTransitionError")) {
    return errorResponse(409, "invalid_transition", "That task transition is not allowed");
  }
  if (error instanceof BlockedReasonRequiredError || (error instanceof Error && error.name === "BlockedReasonRequiredError")) {
    return errorResponse(400, "blocked_reason_required", "A reason is required when blocking a task");
  }
  return errorResponse(500, "internal_error", "The task request could not be completed");
}

async function body(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ZodError([{ code: "custom", path: [], message: "Request body must be valid JSON" }]);
  }
}

export async function listTasks(projectId: string, store: TaskStore): Promise<Response> {
  try {
    const { projectId: validProjectId } = ProjectIdParamsSchema.parse({ projectId });
    return Response.json({ data: await store.listForProject(validProjectId) });
  } catch (error) {
    return handledError(error);
  }
}

export async function createTask(request: Request, projectId: string, store: TaskStore): Promise<Response> {
  try {
    const rawBody = await body(request);
    const input = CreateTaskInputSchema.parse({
      ...(rawBody && typeof rawBody === "object" && !Array.isArray(rawBody) ? rawBody : {}),
      projectId,
    });
    return Response.json({ data: TaskSchema.parse(await store.create(input)) }, { status: 201 });
  } catch (error) {
    return handledError(error);
  }
}

export async function transitionTask(request: Request, taskId: string, store: TaskStore): Promise<Response> {
  try {
    const input = TransitionTaskInputSchema.parse(await body(request));
    const eventType = input.status === "blocked" ? "task_blocked" : input.status === "done" ? "task_completed" : input.status === "cancelled" ? "task_cancelled" : "task_queued";
    const task = await store.transition(taskId, {
      expectedVersion: input.version,
      status: input.status,
      phase: input.phase,
      blockedReason: input.blockedReason,
      eventType,
      eventMessage: `Task moved to ${input.status}`,
    });
    return Response.json({ data: TaskSchema.parse(task) });
  } catch (error) {
    return handledError(error);
  }
}

export async function enqueueResearch(taskId: string, store: TaskStore, runs: RunStore, boss: PgBoss): Promise<Response> {
  try {
    const task = await store.get(taskId);
    if (!task) throw new RecordNotFoundError("Task", taskId);
    if (task.status === "archived") throw new ArchivedProjectError(task.projectId);
    const run = await runs.create({ taskId });
    const idempotencyKey = randomUUID();
    const jobId = await boss.send("research.run", {
      taskId: task.id,
      runId: run.id,
      idempotencyKey,
      promptVersionId: task.promptVersionId ?? task.id,
      skillVersionId: task.skillVersionId ?? task.id,
    }, { singletonKey: idempotencyKey });
    if (!jobId) throw new Error("Unable to enqueue research.run");
    const updatedRun = await runs.update(run.id, { jobId });
    return Response.json({ data: updatedRun }, { status: 202 });
  } catch (error) {
    return handledError(error);
  }
}
