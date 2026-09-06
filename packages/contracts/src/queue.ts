import { z } from "zod";
import { EntityIdSchema } from "./common.js";

const QueueEnvelopeSchema = z.object({
  taskId: EntityIdSchema,
  runId: EntityIdSchema,
  idempotencyKey: z.string().min(16).max(255),
});

export const ResearchRunPayloadSchema = QueueEnvelopeSchema.extend({
  promptVersionId: EntityIdSchema.nullable(),
  skillVersionId: EntityIdSchema.nullable(),
});

export const ResearchResumePayloadSchema = ResearchRunPayloadSchema.extend({
  codexThreadId: z.string().min(1).max(255),
});

export const ResearchCancelPayloadSchema = QueueEnvelopeSchema.extend({
  requestedBy: z.literal("operator"),
});

export const RetentionCleanupPayloadSchema = QueueEnvelopeSchema.extend({
  projectId: EntityIdSchema,
  temporaryPrefix: z.string().regex(/^tmp\/[0-9a-f-]+\/$/),
});

export type ResearchRunPayload = z.infer<typeof ResearchRunPayloadSchema>;
export type ResearchResumePayload = z.infer<typeof ResearchResumePayloadSchema>;
export type ResearchCancelPayload = z.infer<typeof ResearchCancelPayloadSchema>;
export type RetentionCleanupPayload = z.infer<typeof RetentionCleanupPayloadSchema>;
