#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/.." && pwd)"
backup_dir="${repo_root}/backups"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_file="${backup_dir}/rsrch-${timestamp}.dump"

cd "${repo_root}"
mkdir -p "${backup_dir}"

if ! docker compose ps --status running postgres | grep -q postgres; then
  echo "PostgreSQL is not running. Start it with: pnpm infra:up" >&2
  exit 1
fi

docker compose exec -T postgres sh -c \
  'exec pg_dump --format=custom --username="$POSTGRES_USER" --dbname="$POSTGRES_DB"' \
  > "${backup_file}"

echo "Backup written to ${backup_file}"
