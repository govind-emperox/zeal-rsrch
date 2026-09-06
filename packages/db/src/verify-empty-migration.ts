import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { createDatabaseClient } from "./client.js";
import { getDatabaseUrl } from "./environment.js";

const databaseName = `rsrch_migration_verify_${randomUUID().replaceAll("-", "")}`;
const baseUrl = new URL(getDatabaseUrl());
const verificationUrl = new URL(baseUrl);
verificationUrl.pathname = `/${databaseName}`;
const admin = new Pool({ connectionString: baseUrl.toString(), max: 1 });
const migrationsFolder = fileURLToPath(new URL("../drizzle", import.meta.url));

let databaseCreated = false;
try {
  await admin.query(`create database "${databaseName}"`);
  databaseCreated = true;
  const verification = createDatabaseClient({ connectionString: verificationUrl.toString(), max: 1 });
  try {
    await migrate(verification.db, { migrationsFolder });
    const result = await verification.pool.query<{ count: string }>(
      `select count(*)::text as count
       from information_schema.tables
       where table_schema = 'public'
         and table_name = any($1::text[])`,
      [
        [
          "approval_requests",
          "cleanup_audits",
          "files",
          "messages",
          "projects",
          "prompt_versions",
          "reports",
          "research_runs",
          "run_events",
          "skill_versions",
          "sources",
          "tasks",
        ],
      ],
    );
    if (result.rows[0]?.count !== "12") {
      throw new Error(`Expected 12 application tables, found ${result.rows[0]?.count ?? "none"}`);
    }
  } finally {
    await verification.close();
  }
  console.log("Empty-database migration verification passed.");
} finally {
  if (databaseCreated) {
    await admin.query(
      `select pg_terminate_backend(pid) from pg_stat_activity where datname = $1 and pid <> pg_backend_pid()`,
      [databaseName],
    );
    await admin.query(`drop database if exists "${databaseName}"`);
  }
  await admin.end();
}
