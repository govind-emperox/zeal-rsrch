# Research Worker

The research worker dequeues project tasks, starts or resumes local Codex app-server threads, persists append-only run events, stores generated artifacts, and records cleanup audits.

The dashboard enqueues work and returns promptly rather than executing Codex work inside a request handler. The implementation lives in `services/research-worker`; this directory remains an architectural pointer for older project notes.

See [`prd/rsrch-pilot-prd.md`](../../prd/rsrch-pilot-prd.md) for the Release 1 event model, data model, and integration requirements.
