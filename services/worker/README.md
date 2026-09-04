# Research Worker

The research worker will dequeue project tasks, start or resume local Codex threads, persist append-only run events, store generated artifacts, and record cleanup audits.

The dashboard must enqueue work and return promptly rather than execute Codex work inside a request handler. Implement the worker after the Codex SDK/app-server integration spike is complete.

See [`prd/rsrch-pilot-prd.md`](../../prd/rsrch-pilot-prd.md) for the Release 1 event model, data model, and integration requirements.
