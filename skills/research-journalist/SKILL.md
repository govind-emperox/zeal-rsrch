---
name: research-journalist
description: Conduct source-grounded research and write journalist-style reports with web searching, source triage, citation verification, original synthesis, temporary note handling, and cleanup. Use when Codex is asked to research a topic, compare sources, investigate a claim, summarize public web evidence, produce a cited report, or act like a research journalist.
---

# Research Journalist

Use this skill to turn an open-ended research request into a source-grounded report written in original prose with clear citations, visible methodology, and disciplined handling of temporary source material.

## Operating Principles

- Treat the user request as an editorial research assignment: identify the real question, the audience, the scope, the time window, and what would count as adequate evidence.
- Browse or search when facts may be current, disputed, niche, or high-stakes. Do not rely on memory for recent facts, policies, laws, prices, leadership, release status, or active events.
- Prefer primary sources: official records, company filings, standards, laws, papers, original interviews/statements, public datasets, and direct documentation. Use secondary reporting for context and contrast.
- Write from understanding, not extraction. Final prose must be original synthesis, not stitched source summaries.
- Keep source-derived raw material temporary. Retain final reports, source manifests, citation lists, and cleanup audits; delete raw/extracted third-party content when the task is done unless the user explicitly requests retention.

## Research Workflow

1. Frame the assignment.
   - Restate the research question internally with scope, geography, time window, and output needs.
   - Ask a clarifying question only when the missing scope would materially change the research or could create high-stakes error.
   - Identify likely primary sources, opposing views, and exclusion criteria before searching deeply.

2. Discover and triage sources.
   - Use available web/search/browser tools. When Firecrawl search, scrape, map, crawl, parse, or research-index tools are available and appropriate, prefer them for web collection and structured extraction.
   - For papers, technical claims, legal/regulatory questions, financial claims, medical/scientific topics, or public policy, prioritize authoritative domain sources over general search snippets.
   - Deduplicate by canonical URL, title, publisher, publication date, and content overlap.
   - Keep paywalled, login-only, CAPTCHA-protected, or disallowed pages out of the fetch path. Record bibliographic metadata when useful, but do not bypass access controls.

3. Build a source manifest.
   - Track each meaningful source with URL, title, publisher, author or organization, publication date, retrieval date, source type, access status, and notes on relevance.
   - Distinguish primary, secondary, official, scholarly, news, social, vendor, and opinion sources.
   - Record limitations such as missing dates, inaccessible content, unresolved authorship, or possible conflicts of interest.

4. Take temporary research notes.
   - Keep notes brief and claim-focused: key facts, dates, entities, evidence, caveats, contradictions, and useful short quotes.
   - Avoid retaining full page text, full article extracts, or long copied passages.
   - Use short direct quotes only when wording itself matters, and attribute them precisely.

5. Synthesize the report.
   - Lead with the core finding or answer.
   - Explain why the finding matters and what evidence supports it.
   - Separate confirmed facts, interpretation, uncertainty, and unresolved questions.
   - Include competing explanations or conflicting evidence when material.
   - Cite every non-obvious factual claim with links to supporting sources.
   - Keep language clear, neutral, and readable; avoid promotional, SEO-like, or source-like phrasing.

6. Verify before finalizing.
   - Check that every cited claim is supported by the cited source.
   - Check publication and retrieval dates for time-sensitive claims.
   - Check that quotes are short, exact, attributed, and used sparingly.
   - Check that the report does not preserve raw source text or extracted page bodies.
   - If confidence is limited, say what evidence is missing or unresolved.

7. Clean up.
   - Delete temporary raw pages, extracted markdown/text, intermediate JSON, browser downloads, and temporary source-note files created for the run when they contain third-party source content.
   - Retain only the final report, source manifest, citation list, cleanup audit, and user-provided files that should remain part of the project.
   - If any cleanup step cannot be completed, state what remains and why.

## File Conventions

When saving research output locally, use this convention unless the user gives another path:

```text
docs/research-runs/<slug>/
  report.md
  source-manifest.md
  cleanup-audit.md
```

Use temporary working storage only when needed:

```text
/tmp/codex-research/<slug>/
```

The retained `source-manifest.md` should be metadata-focused, not a copy of source content.

## Report Shape

Adapt the structure to the assignment, but default to:

```text
# <Report Title>

Date: <YYYY-MM-DD>
Scope: <one or two sentences>

## Lead Finding
## Key Findings
## Analysis
## What Is Uncertain Or Contested
## Source Notes
## Methodology And Limitations
```

Use inline citations or short linked source references throughout the body. Do not place all citations only at the end.

## Cleanup Audit Shape

If files were created during research, end with a short audit such as:

```text
# Cleanup Audit

Retained:
- report.md
- source-manifest.md
- cleanup-audit.md

Deleted:
- /tmp/codex-research/<slug>/<temporary-file>

Not deleted:
- <path or system area>, because <reason>
```

Do not claim deletion of provider logs, remote service logs, browser internals, or system caches that were not directly controlled in the workspace.
