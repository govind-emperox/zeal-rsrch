import { describe, expect, it } from "vitest";
import { resolveApproval } from "./approval-api";

describe("approval API", () => {
  it("validates and persists an operator decision", async () => {
    let decision: string | undefined;
    const approval = {
      id: "018f0b21-4b4e-7c26-9f2f-0d15dc2f31f1",
      status: "pending",
    };
    const response = await resolveApproval(
      new Request("http://localhost", { method: "POST", body: JSON.stringify({ decision: "accept" }) }),
      approval.id,
      {
        get: async () => approval,
        resolve: async (_id: string, value: "accept" | "accept_for_session" | "decline" | "cancel") => { decision = value; return { ...approval, status: "accepted", decision: value }; },
      } as never,
    );
    expect(response.status).toBe(200);
    expect(decision).toBe("accept");
  });

  it("returns not found without resolving", async () => {
    const response = await resolveApproval(
      new Request("http://localhost", { method: "POST", body: JSON.stringify({ decision: "decline" }) }),
      "missing",
      { get: async () => null } as never,
    );
    expect(response.status).toBe(404);
  });
});
