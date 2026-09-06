#!/usr/bin/env bash
set -euo pipefail

if ! command -v grep >/dev/null 2>&1; then
  echo "grep is required for secret scanning." >&2
  exit 1
fi

# Scan tracked source and documentation only; lockfiles and generated assets contain
# dependency metadata that is not application configuration.
matches="$(git ls-files -z -- ':!.env.example' ':!pnpm-lock.yaml' ':!**/node_modules/**' ':!**/.next/**' | \
  xargs -0 grep -n -E -i \
    -e '-----BEGIN (RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----' \
    -e '[Aa][Pp][Ii][_ -]?[Kk][Ee][Yy][[:space:]]*[:=][[:space:]]*[A-Za-z0-9_./+=-]{16,}' \
    -e '[Ss][Ee][Cc][Rr][Ee][Tt][[:space:]]*[:=][[:space:]]*[A-Za-z0-9_./+=-]{16,}' \
    -e '[Tt][Oo][Kk][Ee][Nn][[:space:]]*[:=][[:space:]]*[A-Za-z0-9_./+=-]{16,}' \
    -e '[Pp][Aa][Ss][Ss][Ww][Oo][Rr][Dd][[:space:]]*[:=][[:space:]]*[A-Za-z0-9_./+=-]{16,}' \
    -e 'AKIA[0-9A-Z]{16}' \
    -e 'gh[pousr]_[A-Za-z0-9_]{20,}' \
    -e 'sk-[A-Za-z0-9]{20,}' \
    || true)"

if [[ -n "${matches}" ]]; then
  echo "Potential committed secret material found:" >&2
  printf '%s\n' "${matches}" >&2
  exit 1
fi

echo "No potential secrets found in tracked application files."
