import type { Database } from "../client.js";
import { ApprovalRepository } from "./approvals.js";
import { CleanupAuditRepository } from "./cleanup-audits.js";
import { FileRepository } from "./files.js";
import { MessageRepository } from "./messages.js";
import { ProjectRepository } from "./projects.js";
import { ResearchRunRepository } from "./runs.js";
import { RunEventRepository } from "./events.js";
import { SourceRepository } from "./sources.js";
import { TaskRepository } from "./tasks.js";
import { ReportRepository } from "./reports.js";
import { VersionRepository } from "./versions.js";

export * from "./approvals.js";
export * from "./cleanup-audits.js";
export * from "./events.js";
export * from "./files.js";
export * from "./messages.js";
export * from "./projects.js";
export * from "./reports.js";
export * from "./runs.js";
export * from "./sources.js";
export * from "./tasks.js";
export * from "./versions.js";

export function createRepositories(db: Database) {
  return {
    projects: new ProjectRepository(db),
    tasks: new TaskRepository(db),
    runs: new ResearchRunRepository(db),
    events: new RunEventRepository(db),
    messages: new MessageRepository(db),
    sources: new SourceRepository(db),
    files: new FileRepository(db),
    reports: new ReportRepository(db),
    cleanupAudits: new CleanupAuditRepository(db),
    approvals: new ApprovalRepository(db),
    versions: new VersionRepository(db),
  };
}
