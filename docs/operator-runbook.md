# Operator Runbook

## Scope and prerequisites

RSRCH Pilot is a local, single-operator service. PostgreSQL stores application state and local filesystem storage holds artifacts. The worker is a separate process that consumes pg-boss jobs.

Install Node.js 22.12 or newer, pnpm 11.1.3, Docker with Compose, and the Codex CLI when research execution is required. Create a root `.env` file that is not committed:

```sh
POSTGRES_PASSWORD should be set to a long, unique local password.
DATABASE_URL=postgresql://rsrch:use-a-long-unique-local-password@127.0.0.1:54320/rsrch
STORAGE_ROOT=/absolute/path/outside/the/repository/rsrch-storage
```

Keep `STORAGE_ROOT` on a local volume owned by the operator. Do not store production secrets, raw source copies, or credentials in PostgreSQL events, logs, cleanup audits, or the repository.

## Local startup

```sh
pnpm install
pnpm infra:up
pnpm db:migrate
pnpm db:seed:cur8r
pnpm dev:dashboard
```

In another terminal, start the worker after migrations are complete:

```sh
pnpm dev:worker
```

Use `pnpm infra:status` to inspect PostgreSQL. The dashboard health endpoint is `http://localhost:3000/api/health`; it reports database connectivity, storage writability, worker-heartbeat configuration, and Codex availability. A configured heartbeat is informational in this slice and is not a process supervisor.

## Migrations

Apply checked-in migrations with `pnpm db:migrate`. It is safe to rerun. For schema work, run `pnpm db:generate`, review the generated migration, then apply it. Do not use `drizzle-kit push` for shared schema changes.

`pnpm db:verify-migrations` creates a disposable database and validates the full migration chain. `pnpm --filter @zeal-rsrch/db test` exercises repository integration against the `DATABASE_URL` database, so use a disposable local database or take a backup first.

## Backup and restore

Create a custom-format PostgreSQL backup with:

```sh
pnpm db:backup
```

Backups are written to `backups/` and contain PostgreSQL records, not filesystem artifacts. Back up `STORAGE_ROOT` separately with a filesystem-aware tool while the worker is stopped. Preserve the database dump and artifact backup together because artifact metadata references storage keys.

Restore a dump only to the intended local database:

```sh
pnpm db:restore -- backups/rsrch-YYYYMMDDTHHMMSSZ.dump
```

The restore command requires the literal confirmation `RESTORE` and replaces existing database objects. After restoring, restore the matching storage directory, run `pnpm db:migrate`, and inspect `/api/health` before resuming workers.

## Worker and approvals

The worker creates and consumes `research.run`, `research.resume`, `research.cancel`, and `retention.cleanup` queues. Stop it cleanly with `SIGINT` or `SIGTERM`; it aborts in-flight executor work and asks pg-boss to stop gracefully.

The current worker intentionally has no Codex app-server executor configured. Submitted research jobs therefore fail with `codex_unavailable` until an executor is implemented and configured. Do not treat worker process startup as evidence that research can execute.

Approval records are persisted, but this slice does not connect them to a live Codex app-server approval protocol. Review pending approval records in the dashboard/database before any future executor resumes work; preserve the approval reason, action summary, and decision as the audit trail.

## Recovery

If PostgreSQL is unavailable, stop the dashboard and worker, run `pnpm infra:status`, inspect `pnpm infra:logs`, correct the environment or volume issue, start PostgreSQL, and run `pnpm db:migrate`. Do not manually delete pg-boss tables to clear work; identify and resolve failed jobs through the database and application state.

If storage is not writable, stop the worker before changing permissions or the mount. Confirm the configured `STORAGE_ROOT`, ownership, free space, and health endpoint. Restore missing artifact files from the matching filesystem backup. Database artifact rows without their storage objects cannot be reconstructed from PostgreSQL alone.

If a run fails, retain its event history and terminal code. Retry only after the underlying dependency has recovered. The queue retries retryable failures according to pg-boss policy; terminal executor failures need operator investigation. If task version conflicts occur, reload task state before making another transition.

## Cleanup and retention

Temporary artifacts are under `tmp/<task-id>/` and are removed through `retention.cleanup`. Final reports, manifests, uploads, and cleanup audits are retained and cannot be deleted through the dashboard. Cleanup writes an audit record with deleted, retained, and failed keys.

Run cleanup only after confirming reports and manifests are persisted. Investigate every failed cleanup item and retain its audit record. Never bypass retention by deleting files directly unless performing a documented recovery; direct deletion can leave database metadata pointing at absent content.

## Validation and limits

Run `pnpm check` before release. It scans tracked application content for likely committed credentials, then runs lint, type checks, and unit/integration tests. The scanner is defense in depth, not a replacement for secret management or pre-receive scanning.

Known Slice 7 limits:

- No Codex app-server executor or live approval bridge exists.
- No process supervisor, worker heartbeat writer, authentication, multi-user authorization, encryption-at-rest, or remote object storage is provided.
- Artifact backups require a separate storage-directory backup; `pnpm db:backup` is database-only.
- No browser end-to-end suite is installed; critical server behavior is covered with unit tests and PostgreSQL integration tests when local infrastructure is available.
