export const projects = [
  {
    id: "market-map-q3",
    title: "Q3 AI procurement market map",
    status: "running",
    updated: "Sep 4, 2026 09:18",
    tasks: 6,
    report: "Drafting",
    description: "Vendor landscape, source trail, and buyer risk notes.",
  },
  {
    id: "support-evals",
    title: "Support agent eval evidence review",
    status: "blocked",
    updated: "Sep 3, 2026 17:42",
    tasks: 3,
    report: "Needs review",
    description: "Customer support audit sources and scoring rationale.",
  },
  {
    id: "filing-review",
    title: "Public filing changes monitor",
    status: "complete",
    updated: "Sep 2, 2026 14:07",
    tasks: 4,
    report: "Saved",
    description: "Quarterly filing deltas and citation manifest.",
  },
  {
    id: "paper-scan",
    title: "Research paper scan: synthetic data",
    status: "queued",
    updated: "Sep 1, 2026 11:33",
    tasks: 2,
    report: "Not started",
    description: "Dataset references, author claims, and reproducibility notes.",
  },
];

export const telemetry = [
  {
    time: "09:22:14",
    event: "source_read",
    message: "Parsed procurement platform analyst note",
    status: "running",
  },
  {
    time: "09:20:51",
    event: "draft_started",
    message: "Composing section: market segmentation",
    status: "running",
  },
  {
    time: "09:18:03",
    event: "codex_thread_started",
    message: "Thread rsrch_market_0918 opened",
    status: "complete",
  },
  {
    time: "08:55:49",
    event: "task_blocked",
    message: "Support eval evidence requires operator approval",
    status: "blocked",
  },
  {
    time: "08:42:10",
    event: "cleanup_started",
    message: "Removing temporary scrape objects",
    status: "running",
  },
  {
    time: "08:39:28",
    event: "report_saved",
    message: "Filing change summary stored in reports/",
    status: "complete",
  },
];

export const environmentHealth = [
  { label: "Postgres", value: "Configured locally", status: "complete" },
  { label: "Artifact storage", value: "Local filesystem", status: "complete" },
  { label: "Codex worker", value: "Not implemented", status: "blocked" },
  { label: "Firecrawl", value: "Optional / not configured", status: "queued" },
];

export const tasks = [
  {
    id: "T-104",
    title: "Map enterprise procurement AI vendors",
    status: "researching",
    priority: "high",
    latest: "Reading analyst notes and vendor docs",
    updated: "9 min ago",
    thread: "rsrch_market_0918",
    report: "Drafting",
    progress: 66,
  },
  {
    id: "T-103",
    title: "Verify buyer risk taxonomy",
    status: "review",
    priority: "medium",
    latest: "Needs citation check on security claims",
    updated: "31 min ago",
    thread: "rsrch_risk_0841",
    report: "Needs review",
    progress: 82,
  },
  {
    id: "T-102",
    title: "Collect pricing and packaging evidence",
    status: "drafting",
    priority: "medium",
    latest: "Writing source-backed comparison notes",
    updated: "1 hr ago",
    thread: "rsrch_price_0740",
    report: "Drafting",
    progress: 54,
  },
  {
    id: "T-101",
    title: "Create source retention audit",
    status: "done",
    priority: "low",
    latest: "Cleanup receipt saved",
    updated: "Yesterday",
    thread: "rsrch_cleanup_0602",
    report: "Saved",
    progress: 100,
  },
  {
    id: "T-100",
    title: "Identify procurement datasets",
    status: "backlog",
    priority: "low",
    latest: "Waiting for operator prompt",
    updated: "Yesterday",
    thread: "Not started",
    report: "None",
    progress: 0,
  },
  {
    id: "T-099",
    title: "Resolve blocked source permissions",
    status: "backlog",
    priority: "high",
    latest: "Two publisher pages rejected scrape",
    updated: "2 days ago",
    thread: "rsrch_sources_0911",
    report: "Blocked",
    progress: 12,
    blockedReason: "Operator must approve manual source retention.",
  },
];

export const transcript = [
  {
    role: "operator",
    content:
      "Use $research-journalist for this project. Build a sourced market map of enterprise AI procurement tools and flag claims that need verification.",
  },
  {
    role: "codex",
    content:
      "Planning the collection path. I will separate vendor claims, third-party analysis, and buyer risk evidence, then produce a report and source manifest.",
  },
  {
    role: "event",
    content: "search_started: querying public vendor docs and analyst summaries",
  },
  {
    role: "codex",
    content:
      "Initial source set contains vendor documentation, two analyst notes, and one public procurement guide. Drafting the segmentation section now.",
  },
];

export const sources = [
  {
    title: "Enterprise procurement AI guide",
    publisher: "Industry report",
    type: "report",
    status: "retained",
  },
  {
    title: "Vendor security documentation",
    publisher: "Vendor docs",
    type: "webpage",
    status: "metadata only",
  },
  {
    title: "Buying criteria checklist",
    publisher: "Public framework",
    type: "document",
    status: "retained",
  },
];

export const files = [
  {
    name: "market-map-final-report.md",
    type: "Final report",
    size: "184 KB",
    created: "Sep 4, 2026",
    task: "T-104",
    retention: "final_report",
    cleanup: "Retained",
  },
  {
    name: "source-manifest.json",
    type: "Source manifest",
    size: "76 KB",
    created: "Sep 4, 2026",
    task: "T-104",
    retention: "source_manifest",
    cleanup: "Retained",
  },
  {
    name: "cleanup-audit-0918.json",
    type: "Cleanup audit",
    size: "18 KB",
    created: "Sep 4, 2026",
    task: "T-104",
    retention: "cleanup_audit",
    cleanup: "Passed",
  },
  {
    name: "buyer-risk-notes.md",
    type: "Working report",
    size: "42 KB",
    created: "Sep 3, 2026",
    task: "T-103",
    retention: "final_report",
    cleanup: "Needs review",
  },
];
