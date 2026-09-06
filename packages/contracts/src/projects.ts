import { z } from "zod";
import { EntityIdSchema, IsoDateTimeSchema } from "./common.js";

export const ProjectStatusSchema = z.enum(["active", "archived"]);

export const ProjectIdParamsSchema = z.object({
  projectId: EntityIdSchema,
});

export const ListProjectsQuerySchema = z
  .object({
    includeArchived: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .strict();

export const CreateProjectInputSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2_000).optional(),
});

export const UpdateProjectInputSchema = z
  .object({
    title: z.string().trim().min(1).max(160).optional(),
    description: z.string().trim().max(2_000).nullable().optional(),
    status: ProjectStatusSchema.optional(),
    version: z.number().int().nonnegative(),
  })
  .refine(
    (value) => value.title !== undefined || value.description !== undefined || value.status !== undefined,
    "At least one project field must be changed",
  );

export const ProjectSchema = z.object({
  id: EntityIdSchema,
  title: z.string().min(1).max(160),
  description: z.string().max(2_000).nullable(),
  status: ProjectStatusSchema,
  version: z.number().int().nonnegative(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
  archivedAt: IsoDateTimeSchema.nullable(),
});

export const ProjectResponseSchema = z.object({
  data: ProjectSchema,
});

export const ProjectListResponseSchema = z.object({
  data: z.array(ProjectSchema),
});

export const ArchiveProjectInputSchema = z.object({
  version: z.coerce.number().int().nonnegative(),
});

export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;
export type ProjectIdParams = z.infer<typeof ProjectIdParamsSchema>;
export type ListProjectsQuery = z.infer<typeof ListProjectsQuerySchema>;
export type CreateProjectInput = z.infer<typeof CreateProjectInputSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectInputSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type ProjectResponse = z.infer<typeof ProjectResponseSchema>;
export type ProjectListResponse = z.infer<typeof ProjectListResponseSchema>;
export type ArchiveProjectInput = z.infer<typeof ArchiveProjectInputSchema>;
