export const channels = [
  {
    id: "sci-fi-books-weekly",
    title: "Sci-Fi Books Weekly",
    cadence: "Weekly",
    status: "complete",
    statusLabel: "Publishing",
    description: "New and noteworthy science fiction, curated every week.",
  },
  {
    id: "managing-ai-products",
    title: "Managing AI Products",
    cadence: "Coming soon",
    status: "queued",
    statusLabel: "In production",
    description:
      "Releases, pricing shifts, and patterns for product managers shipping AI.",
  },
  {
    id: "midwest-startup-scene",
    title: "Midwest Startup Scene",
    cadence: "Coming soon",
    status: "queued",
    statusLabel: "In production",
    description: "Midwest AI startup signal, without the noise.",
  },
];

export const projects = [
  {
    id: "science-fiction-books-september-2026",
    title: "Science Fiction Books — September 2026",
    channel: "Sci-Fi Books Weekly",
    episode: "Episode 03",
    status: "review",
    updated: "Sep 6, 2026",
    tasks: 6,
    report: "Shortlist (WIP)",
    description:
      "Sci-Fi Books Weekly · Episode 03 — new and upcoming book releases for September 2026.",
  },
];

export const primaryProject = projects[0];

export const telemetry = [
  {
    time: "Sep 06",
    event: "shortlist_updated",
    message: "Six titles recorded in the September shortlist (WIP)",
    status: "review",
  },
  {
    time: "Sep 04",
    event: "research_compiled",
    message: "34 adult science-fiction releases documented",
    status: "complete",
  },
  {
    time: "Sep 04",
    event: "source_set_recorded",
    message: "Publisher catalogues, Reactor, Gizmodo, Locus, and trade reviews",
    status: "complete",
  },
  {
    time: "Sep 01",
    event: "scope_confirmed",
    message: "Adult science fiction; YA, middle grade, graphic novels, and nonfiction excluded",
    status: "complete",
  },
];

export const environmentHealth = [
  { label: "Postgres", value: "Configured locally", status: "complete" },
  { label: "Artifact storage", value: "Local filesystem", status: "complete" },
  { label: "ChatGPT connection", value: "Not connected", status: "blocked" },
  { label: "Firecrawl", value: "Optional / not configured", status: "queued" },
];

export const tasks = [
  {
    id: "E03-04",
    title: "Review the six-title shortlist",
    status: "review",
    priority: "high",
    latest: "WIP selections need editorial review and final reasons",
    updated: "Sep 6, 2026",
    thread: "Not started",
    report: "Shortlist (WIP)",
    progress: 70,
  },
  {
    id: "E03-01",
    title: "Define the September episode scope",
    status: "done",
    priority: "medium",
    latest: "Adult SF released September 1–30; cross-genre titles qualified",
    updated: "Sep 1, 2026",
    thread: "Reference work",
    report: "Scope saved",
    progress: 100,
  },
  {
    id: "E03-02",
    title: "Compile the September release catalog",
    status: "done",
    priority: "high",
    latest: "34 releases collected from publisher and trade sources",
    updated: "Sep 4, 2026",
    thread: "Reference work",
    report: "Research saved",
    progress: 100,
  },
  {
    id: "E03-03",
    title: "Verify publication details and popularity signals",
    status: "done",
    priority: "high",
    latest: "Dates, publishers, formats, and source notes documented",
    updated: "Sep 4, 2026",
    thread: "Reference work",
    report: "Research saved",
    progress: 100,
  },
  {
    id: "E03-05",
    title: "Write the Episode 03 script",
    status: "backlog",
    priority: "medium",
    latest: "Starts after the shortlist clears the human selection gate",
    updated: "Not started",
    thread: "Not started",
    report: "None",
    progress: 0,
    blockedReason: "Waiting for the shortlist to be approved.",
  },
  {
    id: "E03-06",
    title: "Run editorial review and prepare narration",
    status: "backlog",
    priority: "medium",
    latest: "Final human gate before audio production",
    updated: "Not started",
    thread: "Not started",
    report: "None",
    progress: 0,
  },
];

export const transcript = [
  {
    role: "operator",
    content:
      "Research new and upcoming adult science-fiction books releasing in September 2026 for Sci-Fi Books Weekly, Episode 03.",
  },
  {
    role: "event",
    content: "reference_attached: 34-title research catalog and six-title WIP shortlist",
  },
  {
    role: "codex",
    content:
      "The project brief and existing Cur8r reference files are ready. Connect ChatGPT to start a new research run and compare its results with the current shortlist.",
  },
];

export const sources = [
  {
    title: "Science Fiction Books — September 2026",
    publisher: "Cur8r research",
    type: "research brief",
    status: "34 titles",
  },
  {
    title: "September 2026 SF Releases — Grid view",
    publisher: "Cur8r research",
    type: "CSV dataset",
    status: "34 rows",
  },
  {
    title: "September shortlist (WIP)",
    publisher: "Sci-Fi Books Weekly",
    type: "editorial shortlist",
    status: "6 titles",
  },
];

export const folders = ["research", "shortlist", "channel-setup"];

export const files = [
  {
    name: "september-2026-scifi-releases.md",
    type: "Research brief",
    size: "123 KB",
    created: "Sep 6, 2026",
    task: "E03-02",
    retention: "reference_research",
    state: "Retained",
  },
  {
    name: "September 2026 SF Releases-Grid view.csv",
    type: "Research dataset",
    size: "96 KB",
    created: "Sep 6, 2026",
    task: "E03-03",
    retention: "reference_research",
    state: "Retained",
  },
  {
    name: "September-shortlist-wip.md",
    type: "Working shortlist",
    size: "3.3 KB",
    created: "Sep 6, 2026",
    task: "E03-04",
    retention: "editorial_working",
    state: "Needs review",
  },
];
