import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { createDatabaseClient } from "./client.js";

const migrationsFolder = fileURLToPath(new URL("../drizzle", import.meta.url));
const client = createDatabaseClient({ max: 1 });

try {
  await migrate(client.db, { migrationsFolder });
  console.log("Database migrations applied successfully.");
} finally {
  await client.close();
}
