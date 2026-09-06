import { existsSync } from "node:fs";
import { resolve } from "node:path";

function findEnvironmentFile(): string | undefined {
  const workingDirectory = process.cwd();
  const candidates = [
    resolve(workingDirectory, ".env"),
    resolve(workingDirectory, "../.env"),
    resolve(workingDirectory, "../../.env"),
  ];

  return candidates.find((candidate) => existsSync(candidate));
}

export function loadRootEnvironment(): void {
  const environmentFile = findEnvironmentFile();
  if (!process.env.DATABASE_URL && environmentFile) {
    process.loadEnvFile(environmentFile);
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
