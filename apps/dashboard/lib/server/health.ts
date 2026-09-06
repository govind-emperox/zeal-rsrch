import "server-only";

import { access, mkdir } from "node:fs/promises";
import { constants } from "node:fs";
import { spawnSync } from "node:child_process";
import { createDatabaseClient } from "@zeal-rsrch/db";

export type HealthCheck = { label: string; value: string; status: "active" | "failed" | "queued" };

async function databaseHealth(): Promise<HealthCheck> {
  try {
    const client = createDatabaseClient();
    await client.pool.query("select 1");
    await client.close();
    return { label: "PostgreSQL", value: "Connected", status: "active" };
  } catch {
    return { label: "PostgreSQL", value: "Unavailable", status: "failed" };
  }
}

async function storageHealth(): Promise<HealthCheck> {
  try {
    const root = process.env.STORAGE_ROOT ?? ".rsrch-storage";
    await mkdir(root, { recursive: true });
    await access(root, constants.W_OK);
    return { label: "Storage", value: "Writable", status: "active" };
  } catch {
    return { label: "Storage", value: "Not writable", status: "failed" };
  }
}

export async function getHealthChecks(): Promise<HealthCheck[]> {
  const codex = spawnSync("codex", ["--version"], { stdio: "ignore" }).status === 0;
  return [
    await databaseHealth(),
    { label: "Research worker", value: process.env.WORKER_HEARTBEAT_AT ? "Heartbeat received" : "Heartbeat unavailable", status: process.env.WORKER_HEARTBEAT_AT ? "active" : "queued" },
    await storageHealth(),
    { label: "Codex", value: codex ? "Available" : "Not configured", status: codex ? "active" : "queued" },
  ];
}
