import "server-only";

import type { RunEvent } from "@zeal-rsrch/contracts";

export type EventStore = {
  listForTask(taskId: string, options?: { afterId?: string; limit?: number }): Promise<RunEvent[]>;
};

export function eventStream(events: readonly RunEvent[]): Response {
  const payload = events.map((event) => `id: ${event.id}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join("");
  return new Response(payload || ": connected\n\n", {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream; charset=utf-8",
    },
  });
}
