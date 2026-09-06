import { PgBoss } from "pg-boss";
import { createDatabaseClient, createRepositories, getDatabaseUrl } from "@zeal-rsrch/db";
import { LocalStorage } from "@zeal-rsrch/storage";
import { createQueues } from "./queues.js";
import { ResearchWorker } from "./worker.js";

const database = createDatabaseClient();
const boss = new PgBoss(getDatabaseUrl());
const unsupportedExecutor = {
  async run(): Promise<never> { throw Object.assign(new Error("Codex executor is not configured"), { code: "codex_unavailable" }); },
  async resume(): Promise<never> { throw Object.assign(new Error("Codex executor is not configured"), { code: "codex_unavailable" }); },
  async cancel(): Promise<void> {},
};

await boss.start();
await createQueues(boss);
const worker = new ResearchWorker(boss, createRepositories(database.db), unsupportedExecutor, new LocalStorage(process.env.STORAGE_ROOT ?? "./.rsrch-storage"));
await worker.start();

const shutdown = async () => {
  await worker.stop();
  await database.close();
};
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
