# Database Package

`@zeal-rsrch/db` owns the Release 1 PostgreSQL schema, versioned SQL migrations, connection lifecycle, and repositories. PostgreSQL remains authoritative for application records, normalized run events, artifact metadata, approval state, and cleanup audits.

## Commands

Run these from the repository root:

```bash
pnpm infra:up
pnpm db:generate
pnpm db:migrate
pnpm db:verify-migrations
pnpm --filter @zeal-rsrch/db test
```

- `db:generate` compares `src/schema.ts` with the checked-in Drizzle snapshots and creates a versioned SQL migration. Review generated SQL before applying it.
- `db:migrate` applies pending migrations using the root `DATABASE_URL`. It is safe to run repeatedly.
- `db:verify-migrations` creates a uniquely named disposable PostgreSQL database, applies every migration from empty, checks all application tables, and drops the disposable database in a `finally` block.
- The integration suite uses uniquely named records in the configured local database and removes only those records after the suite.

Do not use `drizzle-kit push` for shared schema changes. Generate, review, commit, and apply SQL migrations instead.

## Boundaries

- Store logical artifact keys, never absolute host paths.
- Store bounded event metadata and citation metadata, never raw scraped page bodies.
- Use repository transactions for task state changes paired with append-only events.
- Treat optimistic-lock failures as conflicts requiring a fresh read.
- Keep app-server protocol objects outside this package; only stable normalized fields belong here.
