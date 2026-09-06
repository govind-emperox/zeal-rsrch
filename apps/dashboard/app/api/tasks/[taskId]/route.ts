import { getRepositories } from "@/lib/server/database";
import { transitionTask } from "@/lib/server/task-api";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ taskId: string }> };

export async function PATCH(request: Request, context: Context): Promise<Response> {
  return transitionTask(request, (await context.params).taskId, getRepositories().tasks);
}
