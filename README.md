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

The first implementation target is a local Next.js app backed by Postgres and local-network or cloud file storage.

```text
Next.js server action/API route
  -> @openai/codex-sdk or Codex app-server
  -> starts a Codex thread with "$research-journalist ..."
  -> streams events back into Postgres
  -> dashboard renders task status and outputs
```

The app itself should not call the OpenAI API directly. Codex acts as the local research executor, while the dashboard acts as the control plane and project archive.

## Repository Status

This repository is currently in the product-specification stage. It contains the product requirements and design wireframes for the first release. Application code has not been added yet.

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
