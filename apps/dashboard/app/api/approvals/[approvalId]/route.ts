import { getRepositories } from "@/lib/server/database";
import { resolveApproval } from "@/lib/server/approval-api";

export async function POST(request: Request, context: { params: Promise<{ approvalId: string }> }) {
  const { approvalId } = await context.params;
  return resolveApproval(request, approvalId, getRepositories().approvals);
}
