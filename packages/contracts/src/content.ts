import { z } from "zod";
import { EntityIdSchema, IsoDateTimeSchema, StorageKeySchema } from "./common.js";

export const MessageRoleSchema = z.enum(["user", "assistant"]);
export const MessageSchema = z.object({
  id: EntityIdSchema,
  taskId: EntityIdSchema,
  runId: EntityIdSchema.nullable(),
  role: MessageRoleSchema,
  content: z.string().min(1).max(100_000),
  createdAt: IsoDateTimeSchema,
});

export const SourceTypeSchema = z.enum([
  "webpage",
  "paper",
  "document",
  "filing",
  "dataset",
  "book",
  "other",
]);

export const SourceSchema = z.object({
  id: EntityIdSchema,
  taskId: EntityIdSchema,
  runId: EntityIdSchema,
  type: SourceTypeSchema,
  url: z
    .url({ protocol: /^https?$/ })
    .max(2_048)
    .nullable(),
  title: z.string().min(1).max(500),
  publisher: z.string().max(300).nullable(),
  author: z.string().max(300).nullable(),
  publishedAt: IsoDateTimeSchema.nullable(),
  retrievedAt: IsoDateTimeSchema,
  accessStatus: z.enum(["available", "metadata_only", "blocked", "unavailable"]),
});

export const RetentionClassSchema = z.enum([
  "final_report",
  "source_manifest",
  "cleanup_audit",
  "user_file",
  "temporary_scrape",
  "temporary_notes",
]);

export const ArtifactKindSchema = z.enum(["report", "manifest", "audit", "upload", "temporary"]);

export const ArtifactSchema = z.object({
  id: EntityIdSchema,
  projectId: EntityIdSchema,
  taskId: EntityIdSchema.nullable(),
  runId: EntityIdSchema.nullable(),
  kind: ArtifactKindSchema,
  name: z.string().min(1).max(255),
  storageKey: StorageKeySchema,
  contentType: z.string().min(1).max(255),
  contentHash: z.string().regex(/^[a-f0-9]{64}$/),
  sizeBytes: z.number().int().nonnegative(),
  retentionClass: RetentionClassSchema,
  createdAt: IsoDateTimeSchema,
});

export type MessageRole = z.infer<typeof MessageRoleSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type SourceType = z.infer<typeof SourceTypeSchema>;
export type Source = z.infer<typeof SourceSchema>;
export type RetentionClass = z.infer<typeof RetentionClassSchema>;
export type ArtifactKind = z.infer<typeof ArtifactKindSchema>;
export type Artifact = z.infer<typeof ArtifactSchema>;
