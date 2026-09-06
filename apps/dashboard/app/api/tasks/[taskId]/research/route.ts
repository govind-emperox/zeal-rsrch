import { getRepositories } from "@/lib/server/database";
import { getQueue } from "@/lib/server/queue";
import { cancelResearch, enqueueResearch } from "@/lib/server/task-api";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ taskId: string }> };

export async function POST(_request: Request, context: Context): Promise<Response> {
  const repositories = getRepositories();
  return enqueueResearch((await context.params).taskId, repositories.tasks, repositories.runs, await getQueue());
}


export async function DELETE(_request: Request, context: Context): Promise<Response> {
  const repositories = getRepositories();
  return cancelResearch((await context.params).taskId, repositories.tasks, repositories.runs, await getQueue());
}
