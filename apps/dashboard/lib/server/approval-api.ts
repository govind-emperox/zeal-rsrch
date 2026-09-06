import { ZodError } from "zod";
import { ResolveApprovalInputSchema, type ApprovalRequest, type ResolveApprovalInput } from "@zeal-rsrch/contracts";
import { RecordNotFoundError } from "@zeal-rsrch/db";

export type ApprovalStore = {
  get(id: string): Promise<ApprovalRequest | null>;
  resolve(id: string, decision: ResolveApprovalInput["decision"]): Promise<ApprovalRequest>;
};

export async function resolveApproval(request: Request, approvalId: string, store: ApprovalStore): Promise<Response> {
  try {
    const current = await store.get(approvalId);
    if (!current) throw new RecordNotFoundError("Approval", approvalId);
    const input = ResolveApprovalInputSchema.parse(await request.json());
    return Response.json({ data: await store.resolve(approvalId, input.decision) });
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      return Response.json({ error: { code: "validation_error", message: "A valid approval decision is required" } }, { status: 400 });
    }
    if (error instanceof RecordNotFoundError || (error instanceof Error && error.name === "RecordNotFoundError")) {
      return Response.json({ error: { code: "not_found", message: "The pending approval was not found" } }, { status: 404 });
    }
    return Response.json({ error: { code: "internal_error", message: "The approval could not be resolved" } }, { status: 500 });
  }
}
