# RSRCH Pilot Design Manifest

Current as of 2026-09-04.

This manifest covers the required design files copied into `prd/design`. These SVG wireframes are the only design references included in this repository. Generated HTML, generated PNG previews, and ZIP source packages are intentionally excluded.

| File | Screen | Purpose | Size | SHA-256 |
| --- | --- | --- | ---: | --- |
| [projects-overview-wireframe.svg](projects-overview-wireframe.svg) | Projects Overview | Dashboard/control plane wireframe for project table, telemetry stream, worker status, and summary metrics. | 1,323,305 bytes | `396fe32c4a5d2a41d3768dd03a044430c5a7ca549775d25802e117f6c1fe8610` |
| [project-chatbot-wireframe.svg](project-chatbot-wireframe.svg) | Project Chatbot | Project-scoped chat execution wireframe with thread list, transcript, pipeline events, sources, and retention audit panel. | 2,199,220 bytes | `7ee8e9993746486b990962c09fab340f5bbd41b305e85fae75f2af5b8ad77cf5` |
| [research-kanban-wireframe.svg](research-kanban-wireframe.svg) | Research Kanban | Workflow board wireframe for Backlog, Researching, Drafting, Review, and Done task states. | 1,825,783 bytes | `c8c4cdee7904ba94438b4f6b3839e4b1376c7bb23d09aaeb4b02af004626a882` |
| [project-files-artifacts-wireframe.svg](project-files-artifacts-wireframe.svg) | Project Files And Artifacts | Artifact browser wireframe for reports, source manifests, cleanup audits, uploads, list view, and preview panel. | 2,229,774 bytes | `063238443f54fd578e1ba82f2e05bfab87bed9752fa3e45964c304a621ba6562` |

## Usage Notes

- Treat these files as product wireframes and visual references, not implementation code.
- Keep the PRD links relative to `prd/`, for example `design/projects-overview-wireframe.svg`.
- If a design file changes, update this manifest with the new size and SHA-256 hash.
