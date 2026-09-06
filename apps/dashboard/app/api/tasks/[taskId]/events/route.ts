import { z } from "zod";
import { getRepositories } from "@/lib/server/database";
import { eventStream } from "@/lib/server/events";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ taskId: string }> };

export async function GET(request: Request, context: Context): Promise<Response> {
  const afterId = request.headers.get("last-event-id") ?? new URL(request.url).searchParams.get("afterId") ?? undefined;
  const parsed = afterId ? z.string().regex(/^[1-9]\d*$/).safeParse(afterId) : { success: true as const, data: undefined };
  if (!parsed.success) return Response.json({ error: { code: "validation_error", message: "Last-Event-ID must be a positive event ID" } }, { status: 400 });
  const events = await getRepositories().events.listForTask((await context.params).taskId, { afterId: parsed.data });
  return eventStream(events);
}
