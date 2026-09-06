import { asc, eq } from "drizzle-orm";
import type { Source, SourceType } from "@zeal-rsrch/contracts";
import type { Database } from "../client.js";
import { mapSource } from "../mappers.js";
import { sources } from "../schema.js";

export type CreateSourceInput = {
  taskId: string;
  runId: string;
  type: SourceType;
  url?: string | null;
  title: string;
  publisher?: string | null;
  author?: string | null;
  publishedAt?: Date | null;
  retrievedAt: Date;
  accessStatus: Source["accessStatus"];
  citationLabel?: string | null;
};

export class SourceRepository {
  constructor(private readonly db: Database) {}

  async create(input: CreateSourceInput): Promise<Source> {
    const [row] = await this.db.insert(sources).values(input).returning();
    return mapSource(row);
  }

  async listForTask(taskId: string): Promise<Source[]> {
    const rows = await this.db
      .select()
      .from(sources)
      .where(eq(sources.taskId, taskId))
      .orderBy(asc(sources.createdAt));
    return rows.map(mapSource);
  }
}
