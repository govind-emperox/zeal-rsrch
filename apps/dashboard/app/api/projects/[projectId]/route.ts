import { archiveProject, getProject, updateProject } from "@/lib/server/project-api";
import { getRepositories } from "@/lib/server/database";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  const { projectId } = await context.params;
  return getProject(projectId, getRepositories().projects);
}

export async function PATCH(request: Request, context: RouteContext): Promise<Response> {
  const { projectId } = await context.params;
  return updateProject(projectId, request, getRepositories().projects);
}

export async function DELETE(request: Request, context: RouteContext): Promise<Response> {
  const { projectId } = await context.params;
  return archiveProject(projectId, request, getRepositories().projects);
}
