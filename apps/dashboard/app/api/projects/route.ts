import { createProject, listProjects } from "@/lib/server/project-api";
import { getRepositories } from "@/lib/server/database";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  return listProjects(request, getRepositories().projects);
}

export async function POST(request: Request): Promise<Response> {
  return createProject(request, getRepositories().projects);
}
