# zeal-rsrch

`zeal-rsrch` is the public repository for **RSRCH Pilot**, a local-first research workspace in the Zeal Automation suite.

RSRCH Pilot is intended to help a single operator run organized research projects with a local Codex-backed agent, track the work in a dashboard, and keep the resulting reports, source manifests, cleanup audits, and project files in one place.

## Zeal Automation Context

RSRCH Pilot is being built as an open-source product under the Zeal Automation suite. Zeal Automation focuses on production AI reliability, evals, and independent auditing for AI workflows. RSRCH Pilot brings those operating patterns into a local research workspace: explicit task state, source trails, citations, output review, and cleanup records.

Our team is also working on:

- **Zeal Sentinel**: independent auditing for AI customer support agents, with learnings around reliability scoring, failure taxonomies, reproducible evals, and audit-grade evidence.
- **Cur8r**: AI-native procurement, tender, and bidding intelligence, with learnings around document-heavy workflows, requirement extraction, source organization, and human-reviewable outputs.

Reusable learnings, product patterns, and public-safe eval assets from these projects may be generalized into this OSS repo. Private product code, customer data, proprietary prompts, and confidential datasets are out of scope for the public repository.

Links:

- [Zeal Automation](https://www.thezeal.ai/)
- [Cur8r](https://www.cur8r.xyz/about)

## What RSRCH Pilot Does

RSRCH Pilot treats each research request as a project. A project can contain multiple chats, research tasks, source records, workflow cards, generated reports, and retained files.

The planned application has four main areas:

- **Dashboard**: a compact overview of active projects, task state, recent activity, and worker status.
- **Project Chatbot**: a project-scoped chat interface that sends research requests to a local Codex backend.
- **Kanban**: a simple board for moving research work through stages such as intake, collecting, synthesizing, drafting, and complete.
- **Files Browser**: a project file view for final reports, source manifests, cleanup audits, uploads, and generated artifacts.

## Intended Workflow

1. Create or open a research project.
2. Start a project chat or task with a research request.
3. Let the local Codex backend run the research workflow.
4. Watch task status and events update in the dashboard.
5. Review generated reports, source manifests, citations, and cleanup audit records.
6. Continue the project with follow-up chats or new tasks as needed.

## Planned Architecture

The Release 1 implementation is a local Next.js app backed by PostgreSQL and local filesystem artifact storage.

```text
Next.js server action/API route
  -> PostgreSQL / pg-boss queue
  -> worker invokes Codex app-server over stdio/JSONL
  -> starts a Codex thread with "$research-journalist ..."
  -> streams events back into Postgres
  -> dashboard renders task status and outputs
```

The app itself should not call the OpenAI API directly. Codex acts as the local research executor, while the dashboard acts as the control plane and project archive.

## Repository Layout

This repository is organized as a pnpm monorepo:

```text
apps/
  dashboard/        Next.js Release 1 dashboard
packages/
  contracts/        Zod schemas and stable shared types
  domain/           Lifecycle, retry, retention, key, and prompt rules
  db/               Drizzle schema, SQL migrations, and repositories
services/
  research-worker/  Long-running Codex app-server research worker
prd/                Product requirements and design wireframes
```

The dashboard project, task, activity, approval, and artifact views are backed by PostgreSQL. The research worker executes tasks through the local Codex app-server and persists reports, source manifests, and cleanup audits to local artifact storage.

## Development

Install dependencies, start PostgreSQL, and apply migrations before starting the dashboard:

```sh
pnpm install
pnpm infra:up
pnpm db:migrate
pnpm db:seed:cur8r
pnpm dev:dashboard
```

Run the complete validation suite with `pnpm check`. See [`packages/db/README.md`](packages/db/README.md) for migration and empty-database verification commands.

## Repository Contents

```text
prd/
  rsrch-pilot-prd.md
  design/
    design-manifest.md
    projects-overview-wireframe.svg
    project-chatbot-wireframe.svg
    research-kanban-wireframe.svg
    project-files-artifacts-wireframe.svg
```

Start with the PRD:

- [`prd/rsrch-pilot-prd.md`](prd/rsrch-pilot-prd.md)

The design files are listed and fingerprinted here:

- [`prd/design/design-manifest.md`](prd/design/design-manifest.md)

## Design Direction

RSRCH Pilot should look and feel like a clean research operations dashboard: compact, readable, and work-focused. The UI should avoid marketing-page patterns, decorative visual effects, and unnecessary product chrome. The first release should prioritize getting from a research request to an organized, reviewable report quickly.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
