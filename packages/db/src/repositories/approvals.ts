import { and, asc, eq } from "drizzle-orm";
import type { ApprovalKind, ApprovalRequest, ResolveApprovalInput } from "@zeal-rsrch/contracts";
import type { Database } from "../client.js";
import { RecordNotFoundError } from "../errors.js";
import { approvalRequests } from "../schema.js";

const mapApproval = (row: typeof approvalRequests.$inferSelect): ApprovalRequest => ({
  id: row.id,
  taskId: row.taskId,
  runId: row.runId,
  codexThreadId: row.codexThreadId,
  codexTurnId: row.codexTurnId,
  codexItemId: row.codexItemId,
  serverRequestId: row.serverRequestId,
  kind: row.kind as ApprovalKind,
    status: row.status as ApprovalRequest["status"],
  reason: row.reason,
  actionSummary: row.actionSummary,
  requestedAt: row.requestedAt.toISOString(),
  resolvedAt: row.resolvedAt?.toISOString() ?? null,
});

export type CreateApprovalInput = {
  taskId: string;
  runId: string;
  codexThreadId: string;
  codexTurnId: string;
  codexItemId: string;
  serverRequestId: string | number;
  kind: ApprovalKind;
  reason?: string | null;
  actionSummary: string;
};

export class ApprovalRepository {
  constructor(private readonly db: Database) {}

  async create(input: CreateApprovalInput): Promise<ApprovalRequest> {
    const [row] = await this.db
      .insert(approvalRequests)
      .values({ ...input, serverRequestId: String(input.serverRequestId) })
      .returning();
    return mapApproval(row);
  }

  async listPendingForTask(taskId: string): Promise<ApprovalRequest[]> {
    const rows = await this.db
      .select()
      .from(approvalRequests)
      .where(and(eq(approvalRequests.taskId, taskId), eq(approvalRequests.status, "pending")))
      .orderBy(asc(approvalRequests.requestedAt));
    return rows.map(mapApproval);
  }

  async resolve(id: string, decision: ResolveApprovalInput["decision"]): Promise<ApprovalRequest> {
    const status =
      decision === "accept" || decision === "accept_for_session"
        ? "accepted"
        : decision === "decline"
          ? "declined"
          : "cancelled";
    const [row] = await this.db
      .update(approvalRequests)
      .set({ status, decision, resolvedAt: new Date() })
      .where(and(eq(approvalRequests.id, id), eq(approvalRequests.status, "pending")))
      .returning();
    if (!row) {
      throw new RecordNotFoundError("Pending approval", id);
    }
    return mapApproval(row);
  }
}
