import { createDatabaseClient } from "./client.js";
import { createRepositories } from "./repositories/index.js";

const title = "Science Fiction Books — September 2026";
const description =
  "Sci-Fi Books Weekly · Episode 03 — new and upcoming book releases for September 2026.";

const client = createDatabaseClient({ max: 1 });

try {
  const repositories = createRepositories(client.db);
  const existing = await repositories.projects.findActiveByTitle(title);
  const project = existing ?? (await repositories.projects.create({ title, description }));
  console.log(`${existing ? "Found" : "Created"} Cur8r project ${project.id}.`);
} finally {
  await client.close();
}
