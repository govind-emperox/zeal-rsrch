import { z } from "zod";
import { EntityIdSchema, IsoDateTimeSchema } from "./common.js";

export const ProjectStatusSchema = z.enum(["active", "archived"]);

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

export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;
export type CreateProjectInput = z.infer<typeof CreateProjectInputSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectInputSchema>;
export type Project = z.infer<typeof ProjectSchema>;
