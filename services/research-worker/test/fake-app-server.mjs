import { createInterface } from "node:readline";

let pendingEchoId;
const lines = createInterface({ input: process.stdin });

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

lines.on("line", (line) => {
  const message = JSON.parse(line);
  if (message.method === "initialize") send({ id: message.id, result: { userAgent: "fake" } });
  if (message.method === "echo") {
    pendingEchoId = message.id;
    send({
      method: "item/fileChange/requestApproval",
      id: "approval-1",
      params: { threadId: "thread-1", turnId: "turn-1", itemId: "item-1" },
    });
  }
  if (message.id === "approval-1") {
    send({ id: pendingEchoId, result: { echoed: true, approval: message.result } });
  }
});
