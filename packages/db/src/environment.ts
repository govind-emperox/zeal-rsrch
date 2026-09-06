import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT_ENV_PATH = fileURLToPath(new URL("../../../.env", import.meta.url));

export function loadRootEnvironment(): void {
  if (!process.env.DATABASE_URL && existsSync(ROOT_ENV_PATH)) {
    process.loadEnvFile(ROOT_ENV_PATH);
  }
}

export function getDatabaseUrl(): string {
  loadRootEnvironment();

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const parsed = new URL(databaseUrl);
  if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
    throw new Error("DATABASE_URL must use the postgres or postgresql protocol");
  }

  return databaseUrl;
}
