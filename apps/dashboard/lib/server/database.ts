import "server-only";

import { createDatabaseClient, createRepositories } from "@zeal-rsrch/db";

type DatabaseState = {
  client: ReturnType<typeof createDatabaseClient>;
  repositories: ReturnType<typeof createRepositories>;
};

const globalDatabase = globalThis as typeof globalThis & {
  rsrchDatabase?: DatabaseState;
};

function createDatabaseState(): DatabaseState {
  const client = createDatabaseClient();
  return {
    client,
    repositories: createRepositories(client.db),
  };
}

export function getRepositories(): DatabaseState["repositories"] {
  globalDatabase.rsrchDatabase ??= createDatabaseState();
  return globalDatabase.rsrchDatabase.repositories;
}
