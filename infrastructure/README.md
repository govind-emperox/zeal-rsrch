# Local Infrastructure

RSRCH Pilot currently requires only PostgreSQL as containerized infrastructure. The Next.js dashboard, future research worker, and local Codex app-server run on the macOS host.

## Prerequisites

- Node.js 22.12 or newer
- pnpm 11
- Docker Desktop with Docker Compose
- An authenticated Codex CLI with `codex app-server`
- The finalized `research-journalist` skill at `~/.codex/skills/research-journalist/SKILL.md`

## Start PostgreSQL

The untracked root `.env` contains local-only credentials. To create it on another machine, copy `.env.example`, replace the password in both relevant values, and keep it out of source control.

```bash
pnpm infra:up
pnpm infra:status
```

PostgreSQL listens only on `127.0.0.1:54320`. The database, application role, and default database are all named `rsrch`.

Connect with:

```bash
pnpm db:shell
```

Stop the service without deleting its data:

```bash
pnpm infra:down
```

Do not add `-v` unless intentionally deleting the local database volume.

## Persistence and Backups

PostgreSQL data lives in the named Docker volume `zeal-rsrch-postgres-data`. This survives normal container recreation but is not a backup.

Create a compressed logical backup with:

```bash
pnpm db:backup
```

Backups are written to the ignored root `backups/` directory. Reports, manifests, audits, uploads, and temporary task artifacts will use the ignored root `data/` directory.

## Health Check

The Compose service uses `pg_isready`. `pnpm infra:up` waits until the database is healthy before returning.

## Deferred Infrastructure

Langfuse, Grafana LGTM, and an OpenTelemetry Collector will be added later under an optional `observability` Compose profile. Redis, MinIO, Kubernetes, Temporal, and remote hosting are not required for the current implementation phase.
