import { createTask, listTasks } from "@/lib/server/task-api";
import { getRepositories } from "@/lib/server/database";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ projectId: string }> };

export async function GET(_request: Request, context: Context): Promise<Response> {
  return listTasks((await context.params).projectId, getRepositories().tasks);
}

export async function POST(request: Request, context: Context): Promise<Response> {
  return createTask(request, (await context.params).projectId, getRepositories().tasks);
}
