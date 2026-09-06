import "server-only";

import { PgBoss } from "pg-boss";
import { getDatabaseUrl } from "@zeal-rsrch/db";

const globalQueue = globalThis as typeof globalThis & { rsrchBoss?: PgBoss };

export async function getQueue(): Promise<PgBoss> {
  globalQueue.rsrchBoss ??= new PgBoss(getDatabaseUrl());
  await globalQueue.rsrchBoss.start();
  return globalQueue.rsrchBoss;
}
