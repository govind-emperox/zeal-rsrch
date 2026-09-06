import { z } from "zod";
import { EntityIdSchema, IsoDateTimeSchema } from "./common.js";

export const ApprovalKindSchema = z.enum([
  "command_execution",
  "file_change",
  "permissions",
  "network_access",
  "mcp_tool",
  "user_input",
]);

export const ApprovalStatusSchema = z.enum(["pending", "accepted", "declined", "cancelled", "expired"]);

export const ApprovalRequestSchema = z.object({
  id: EntityIdSchema,
  taskId: EntityIdSchema,
  runId: EntityIdSchema,
  codexThreadId: z.string().min(1).max(255),
  codexTurnId: z.string().min(1).max(255),
  codexItemId: z.string().min(1).max(255),
  serverRequestId: z.union([z.string(), z.number()]),
  kind: ApprovalKindSchema,
  status: ApprovalStatusSchema,
  reason: z.string().max(2_000).nullable(),
  actionSummary: z.string().min(1).max(4_000),
  decision: z.enum(["accept", "accept_for_session", "decline", "cancel"]).nullable().optional(),
  requestedAt: IsoDateTimeSchema,
  resolvedAt: IsoDateTimeSchema.nullable(),
});

export const ResolveApprovalInputSchema = z.object({
  decision: z.enum(["accept", "accept_for_session", "decline", "cancel"]),
});

export type ApprovalKind = z.infer<typeof ApprovalKindSchema>;
export type ApprovalStatus = z.infer<typeof ApprovalStatusSchema>;
export type ApprovalRequest = z.infer<typeof ApprovalRequestSchema>;
export type ResolveApprovalInput = z.infer<typeof ResolveApprovalInputSchema>;
