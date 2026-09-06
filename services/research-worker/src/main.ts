import { PgBoss } from "pg-boss";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createDatabaseClient, createRepositories, getDatabaseUrl } from "@zeal-rsrch/db";
import { LocalStorage } from "@zeal-rsrch/storage";
import { createQueues } from "./queues.js";
import { ResearchWorker } from "./worker.js";
import { CodexResearchExecutor } from "./codex-executor.js";

const database = createDatabaseClient();
const boss = new PgBoss(getDatabaseUrl());
const repositories = createRepositories(database.db);
const repositoryRoot = fileURLToPath(new URL("../../..", import.meta.url));
const storage = new LocalStorage(process.env.STORAGE_ROOT ?? resolve(repositoryRoot, ".rsrch-storage"));
const executor = new CodexResearchExecutor(repositories, storage, {
  workspaceRoot: process.env.CODEX_WORKSPACE_ROOT,
  command: process.env.CODEX_COMMAND,
  model: process.env.CODEX_MODEL,
  effort: process.env.CODEX_EFFORT as "low" | "medium" | "high" | "xhigh" | undefined,
});

await boss.start();
await createQueues(boss);
const worker = new ResearchWorker(boss, repositories, executor, storage);
await worker.start();

const shutdown = async () => {
  await worker.stop();
  await database.close();
};
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
