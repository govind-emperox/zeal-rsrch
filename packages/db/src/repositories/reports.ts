import { desc, eq } from "drizzle-orm";
import type { Database } from "../client.js";
import { reports } from "../schema.js";

export type ReportRecord = {
  id: string;
  projectId: string;
  taskId: string;
  runId: string;
  fileId: string;
  title: string;
  version: number;
  previousReportId: string | null;
  createdAt: string;
};

const mapReport = (row: typeof reports.$inferSelect): ReportRecord => ({
  ...row,
  createdAt: row.createdAt.toISOString(),
});

export class ReportRepository {
  constructor(private readonly db: Database) {}

  async create(input: typeof reports.$inferInsert): Promise<ReportRecord> {
    const [row] = await this.db.insert(reports).values(input).returning();
    return mapReport(row);
  }

  async listForTask(taskId: string): Promise<ReportRecord[]> {
    const rows = await this.db
      .select()
      .from(reports)
      .where(eq(reports.taskId, taskId))
      .orderBy(desc(reports.version));
    return rows.map(mapReport);
  }
}
