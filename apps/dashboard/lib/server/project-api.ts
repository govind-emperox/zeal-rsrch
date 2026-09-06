import { ZodError } from "zod";
import {
  ApiErrorResponseSchema,
  ArchiveProjectInputSchema,
  CreateProjectInputSchema,
  ListProjectsQuerySchema,
  ProjectIdParamsSchema,
  ProjectListResponseSchema,
  ProjectResponseSchema,
  UpdateProjectInputSchema,
  type CreateProjectInput,
  type Project,
  type UpdateProjectInput,
} from "@zeal-rsrch/contracts";
import { OptimisticLockError, RecordNotFoundError } from "@zeal-rsrch/db";

export type ProjectStore = {
  create(input: CreateProjectInput): Promise<Project>;
  get(id: string): Promise<Project | null>;
  list(options?: { includeArchived?: boolean; limit?: number }): Promise<Project[]>;
  update(id: string, input: UpdateProjectInput): Promise<Project>;
};

function json(schema: { parse(value: unknown): unknown }, value: unknown, status = 200): Response {
  return Response.json(schema.parse(value), { status });
}

function validationIssues(error: ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
}

function errorResponse(
  status: number,
  code: string,
  message: string,
  issues?: ReturnType<typeof validationIssues>,
): Response {
  return json(ApiErrorResponseSchema, { error: { code, message, issues } }, status);
}

function databaseErrorCode(error: unknown): string | undefined {
  let current = error;
  for (let depth = 0; depth < 5 && current && typeof current === "object"; depth += 1) {
    if ("code" in current && typeof current.code === "string") {
      return current.code;
    }
    current = "cause" in current ? current.cause : undefined;
  }
  return undefined;
}

function hasErrorName(error: unknown, name: string): boolean {
  return error instanceof Error && error.name === name;
}

function handledError(error: unknown): Response {
  if (error instanceof ZodError) {
    return errorResponse(400, "validation_error", "Request validation failed", validationIssues(error));
  }
  if (error instanceof RecordNotFoundError || hasErrorName(error, "RecordNotFoundError")) {
    return errorResponse(404, "project_not_found", "Project not found");
  }
  if (error instanceof OptimisticLockError || hasErrorName(error, "OptimisticLockError")) {
    return errorResponse(409, "version_conflict", "Project changed; reload it and try again");
  }
  if (databaseErrorCode(error) === "23505") {
    return errorResponse(409, "project_title_conflict", "An active project already uses this title");
  }
  return errorResponse(500, "internal_error", "The project request could not be completed");
}

async function requestBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ZodError([
      {
        code: "custom",
        path: [],
        message: "Request body must be valid JSON",
      },
    ]);
  }
}

export async function listProjects(request: Request, store: ProjectStore): Promise<Response> {
  try {
    const url = new URL(request.url);
    const query = ListProjectsQuerySchema.parse(Object.fromEntries(url.searchParams));
    const projects = await store.list(query);
    return json(ProjectListResponseSchema, { data: projects });
  } catch (error) {
    return handledError(error);
  }
}

export async function createProject(request: Request, store: ProjectStore): Promise<Response> {
  try {
    const input = CreateProjectInputSchema.parse(await requestBody(request));
    const project = await store.create(input);
    return json(ProjectResponseSchema, { data: project }, 201);
  } catch (error) {
    return handledError(error);
  }
}

export async function getProject(projectId: string, store: ProjectStore): Promise<Response> {
  try {
    const params = ProjectIdParamsSchema.parse({ projectId });
    const project = await store.get(params.projectId);
    if (!project) {
      throw new RecordNotFoundError("Project", params.projectId);
    }
    return json(ProjectResponseSchema, { data: project });
  } catch (error) {
    return handledError(error);
  }
}

export async function updateProject(
  projectId: string,
  request: Request,
  store: ProjectStore,
): Promise<Response> {
  try {
    const params = ProjectIdParamsSchema.parse({ projectId });
    const input = UpdateProjectInputSchema.parse(await requestBody(request));
    const project = await store.update(params.projectId, input);
    return json(ProjectResponseSchema, { data: project });
  } catch (error) {
    return handledError(error);
  }
}

export async function archiveProject(
  projectId: string,
  request: Request,
  store: ProjectStore,
): Promise<Response> {
  try {
    const params = ProjectIdParamsSchema.parse({ projectId });
    const url = new URL(request.url);
    const input = ArchiveProjectInputSchema.parse(Object.fromEntries(url.searchParams));
    const project = await store.update(params.projectId, {
      status: "archived",
      version: input.version,
    });
    return json(ProjectResponseSchema, { data: project });
  } catch (error) {
    return handledError(error);
  }
}
