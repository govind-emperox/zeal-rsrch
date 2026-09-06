import { asc, eq } from "drizzle-orm";
import type { Message, MessageRole } from "@zeal-rsrch/contracts";
import type { Database } from "../client.js";
import { mapMessage } from "../mappers.js";
import { messages } from "../schema.js";

export class MessageRepository {
  constructor(private readonly db: Database) {}

  async create(input: { taskId: string; runId?: string | null; role: MessageRole; content: string }): Promise<Message> {
    const [row] = await this.db
      .insert(messages)
      .values({ taskId: input.taskId, runId: input.runId, role: input.role, content: input.content })
      .returning();
    return mapMessage(row);
  }

  async listForTask(taskId: string): Promise<Message[]> {
    const rows = await this.db
      .select()
      .from(messages)
      .where(eq(messages.taskId, taskId))
      .orderBy(asc(messages.createdAt));
    return rows.map(mapMessage);
  }
}
