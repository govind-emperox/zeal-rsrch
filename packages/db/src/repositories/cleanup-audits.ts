import { eq } from "drizzle-orm";
import type { JsonValue } from "@zeal-rsrch/contracts";
import type { Database } from "../client.js";
import { cleanupAudits } from "../schema.js";

export type CleanupAuditRecord = {
  id: string;
  projectId: string;
  taskId: string;
  runId: string;
  auditFileId: string | null;
  status: "complete" | "partial" | "failed";
  deletedItems: JsonValue[];
  retainedItems: JsonValue[];
  failedItems: JsonValue[];
  startedAt: string;
  finishedAt: string | null;
  createdAt: string;
};

const mapAudit = (row: typeof cleanupAudits.$inferSelect): CleanupAuditRecord => ({
  ...row,
  startedAt: row.startedAt.toISOString(),
  finishedAt: row.finishedAt?.toISOString() ?? null,
  createdAt: row.createdAt.toISOString(),
});

export class CleanupAuditRepository {
  constructor(private readonly db: Database) {}

  async create(input: typeof cleanupAudits.$inferInsert): Promise<CleanupAuditRecord> {
    const [row] = await this.db.insert(cleanupAudits).values(input).returning();
    return mapAudit(row);
  }

  async getForRun(runId: string): Promise<CleanupAuditRecord | null> {
    const [row] = await this.db.select().from(cleanupAudits).where(eq(cleanupAudits.runId, runId)).limit(1);
    return row ? mapAudit(row) : null;
  }
}
