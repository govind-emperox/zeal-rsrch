import { z } from "zod";
import { BoundedMetadataSchema, EntityIdSchema, IsoDateTimeSchema } from "./common.js";

export const ResearchRunStatusSchema = z.enum([
  "queued",
  "running",
  "blocked",
  "completed",
  "failed",
  "cancelled",
]);

export const RunEventTypeSchema = z.enum([
  "task_created",
  "task_queued",
  "codex_thread_started",
  "planning_started",
  "search_started",
  "source_found",
  "source_read",
  "draft_started",
  "verification_started",
  "approval_requested",
  "approval_resolved",
  "cleanup_started",
  "cleanup_completed",
  "report_saved",
  "task_completed",
  "task_failed",
  "task_blocked",
  "task_cancelled",
]);

export const CorrelationSchema = z.object({
  projectId: EntityIdSchema,
  taskId: EntityIdSchema,
  jobId: z.string().max(255).nullable().optional(),
  runId: EntityIdSchema.nullable().optional(),
  codexThreadId: z.string().max(255).nullable().optional(),
  codexTurnId: z.string().max(255).nullable().optional(),
  traceId: z.string().max(64).nullable().optional(),
  skillVersion: z.string().max(128).nullable().optional(),
  promptVersion: z.string().max(128).nullable().optional(),
  model: z.string().max(128).nullable().optional(),
  applicationVersion: z.string().max(64).nullable().optional(),
});

export const EventIdSchema = z
  .union([z.number().int().positive(), z.string().regex(/^[1-9]\d*$/)])
  .transform((value) => String(value));

export const RunEventSchema = CorrelationSchema.extend({
  id: EventIdSchema,
  type: RunEventTypeSchema,
  message: z.string().max(1_000),
  metadata: BoundedMetadataSchema,
  createdAt: IsoDateTimeSchema,
});

export const ResearchRunSchema = z.object({
  id: EntityIdSchema,
  taskId: EntityIdSchema,
  jobId: z.string().min(1).max(255).nullable(),
  status: ResearchRunStatusSchema,
  attempt: z.number().int().positive(),
  parentRunId: EntityIdSchema.nullable(),
  terminalCode: z.string().max(100).nullable(),
  startedAt: IsoDateTimeSchema.nullable(),
  finishedAt: IsoDateTimeSchema.nullable(),
  createdAt: IsoDateTimeSchema,
});

export type ResearchRunStatus = z.infer<typeof ResearchRunStatusSchema>;
export type RunEventType = z.infer<typeof RunEventTypeSchema>;
export type Correlation = z.infer<typeof CorrelationSchema>;
export type RunEvent = z.infer<typeof RunEventSchema>;
export type ResearchRun = z.infer<typeof ResearchRunSchema>;
