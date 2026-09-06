import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { CodexAppServerClient } from "./app-server-client.js";

describe("CodexAppServerClient", () => {
  it("initializes JSONL and answers server-initiated approval requests", async () => {
    const fixture = fileURLToPath(new URL("../test/fake-app-server.mjs", import.meta.url));
    const client = new CodexAppServerClient({
      command: process.execPath,
      arguments: [fixture],
      cwd: process.cwd(),
      onServerRequest: async (message) => {
        expect(message.method).toBe("item/fileChange/requestApproval");
        return { decision: "accept" };
      },
    });

    try {
      await client.initialize();
      await expect(client.request("echo", {})).resolves.toEqual({
        echoed: true,
        approval: { decision: "accept" },
      });
    } finally {
      await client.close();
    }
  });
});
