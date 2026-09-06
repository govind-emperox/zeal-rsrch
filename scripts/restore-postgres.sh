#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: pnpm db:restore -- <backup-file.dump>" >&2
  exit 64
fi

backup_file="$1"
if [[ ! -f "${backup_file}" ]]; then
  echo "Backup file does not exist: ${backup_file}" >&2
  exit 66
fi

if ! docker compose ps --status running postgres | grep -q postgres; then
  echo "PostgreSQL is not running. Start it with: pnpm infra:up" >&2
  exit 1
fi

echo "This replaces the current database contents. Type RESTORE to continue:"
read -r confirmation
if [[ "${confirmation}" != "RESTORE" ]]; then
  echo "Restore cancelled."
  exit 0
fi

docker compose exec -T postgres sh -c \
  'exec pg_restore --clean --if-exists --no-owner --username="$POSTGRES_USER" --dbname="$POSTGRES_DB"' \
  < "${backup_file}"

echo "Restore completed from ${backup_file}"
