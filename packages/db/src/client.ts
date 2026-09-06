import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";
import { getDatabaseUrl } from "./environment.js";
import * as schema from "./schema.js";

export type Database = NodePgDatabase<typeof schema>;

export type DatabaseClient = {
  db: Database;
  pool: Pool;
  close: () => Promise<void>;
};

export function createDatabaseClient(overrides: PoolConfig = {}): DatabaseClient {
  const { connectionString = getDatabaseUrl(), ...poolOverrides } = overrides;
  const pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    ...poolOverrides,
  });
  const db = drizzle(pool, { schema });

  return {
    db,
    pool,
    close: () => pool.end(),
  };
}
