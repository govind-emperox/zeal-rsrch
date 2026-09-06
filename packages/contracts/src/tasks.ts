import { z } from "zod";
import { EntityIdSchema, IsoDateTimeSchema } from "./common.js";

export const TaskStatusSchema = z.enum([
  "backlog",
  "queued",
  "researching",
  "drafting",
  "review",
  "done",
  "blocked",
  "failed",
  "cancelled",
  "archived",
]);

export const TaskPrioritySchema = z.enum(["low", "medium", "high"]);

export const TaskPhaseSchema = z.enum([
  "queued",
  "planning",
  "searching",
  "reading",
  "drafting",
  "verifying",
  "cleaning_up",
  "awaiting_approval",
  "complete",
]);

export const CreateTaskInputSchema = z.object({
  projectId: EntityIdSchema,
  title: z.string().trim().min(1).max(200),
  request: z.string().trim().min(1).max(40_000),
  priority: TaskPrioritySchema.default("medium"),
  skillName: z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/).default("research-journalist"),
});

export const UpdateTaskInputSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    priority: TaskPrioritySchema.optional(),
    status: TaskStatusSchema.optional(),
    blockedReason: z.string().trim().min(1).max(2_000).nullable().optional(),
    version: z.number().int().nonnegative(),
  })
  .refine(
    (value) =>
      value.title !== undefined ||
      value.priority !== undefined ||
      value.status !== undefined ||
      value.blockedReason !== undefined,
    "At least one task field must be changed",
  );

export const TaskSchema = z.object({
  id: EntityIdSchema,
  projectId: EntityIdSchema,
  title: z.string().min(1).max(200),
  request: z.string().min(1).max(40_000),
  status: TaskStatusSchema,
  priority: TaskPrioritySchema,
  currentPhase: TaskPhaseSchema.nullable(),
  blockedReason: z.string().max(2_000).nullable(),
  codexThreadId: z.string().max(255).nullable(),
  skillName: z.string().min(1).max(64),
  version: z.number().int().nonnegative(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
  archivedAt: IsoDateTimeSchema.nullable(),
});

export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type TaskPriority = z.infer<typeof TaskPrioritySchema>;
export type TaskPhase = z.infer<typeof TaskPhaseSchema>;
export type CreateTaskInput = z.infer<typeof CreateTaskInputSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskInputSchema>;
export type Task = z.infer<typeof TaskSchema>;
