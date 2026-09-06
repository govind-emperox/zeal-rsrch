import type { Artifact, Message, Project, ResearchRun, RunEvent, Source, Task } from "@zeal-rsrch/contracts";
import type { files, messages, projects, researchRuns, runEvents, sources, tasks } from "./schema.js";

type ProjectRow = typeof projects.$inferSelect;
type TaskRow = typeof tasks.$inferSelect;
type RunRow = typeof researchRuns.$inferSelect;
type EventRow = typeof runEvents.$inferSelect;
type MessageRow = typeof messages.$inferSelect;
type SourceRow = typeof sources.$inferSelect;
type FileRow = typeof files.$inferSelect;

const iso = (date: Date): string => date.toISOString();
const nullableIso = (date: Date | null): string | null => (date ? iso(date) : null);

export function mapProject(row: ProjectRow): Project {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    version: row.version,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
    archivedAt: nullableIso(row.archivedAt),
  };
}

export function mapTask(row: TaskRow): Task {
  return {
    id: row.id,
    projectId: row.projectId,
    title: row.title,
    request: row.request,
    status: row.status,
    priority: row.priority,
    currentPhase: row.currentPhase as Task["currentPhase"],
    blockedReason: row.blockedReason,
    codexThreadId: row.codexThreadId,
    skillName: row.skillName,
    promptVersionId: row.promptVersionId,
    skillVersionId: row.skillVersionId,
    version: row.version,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
    archivedAt: nullableIso(row.archivedAt),
  };
}

export function mapResearchRun(row: RunRow): ResearchRun {
  return {
    id: row.id,
    taskId: row.taskId,
    jobId: row.jobId,
    status: row.status,
    attempt: row.attempt,
    parentRunId: row.parentRunId,
    promptVersionId: row.promptVersionId,
    skillVersionId: row.skillVersionId,
    codexThreadId: row.codexThreadId,
    codexTurnId: row.codexTurnId,
    traceId: row.traceId,
    model: row.model,
    terminalCode: row.terminalCode,
    startedAt: nullableIso(row.startedAt),
    finishedAt: nullableIso(row.finishedAt),
    createdAt: iso(row.createdAt),
  };
}

export function mapRunEvent(row: EventRow): RunEvent {
  return {
    id: row.id.toString(),
    projectId: row.projectId,
    taskId: row.taskId,
    runId: row.runId,
    jobId: row.jobId,
    codexThreadId: row.codexThreadId,
    codexTurnId: row.codexTurnId,
    traceId: row.traceId,
    skillVersion: row.skillVersion,
    promptVersion: row.promptVersion,
    model: row.model,
    applicationVersion: row.applicationVersion,
    type: row.type as RunEvent["type"],
    message: row.message,
    metadata: row.metadata,
    createdAt: iso(row.createdAt),
  };
}

export function mapMessage(row: MessageRow): Message {
  return {
    id: row.id,
    taskId: row.taskId,
    runId: row.runId,
    role: row.role,
    content: row.content,
    createdAt: iso(row.createdAt),
  };
}

export function mapSource(row: SourceRow): Source {
  return {
    id: row.id,
    taskId: row.taskId,
    runId: row.runId,
    type: row.type as Source["type"],
    url: row.url,
    title: row.title,
    publisher: row.publisher,
    author: row.author,
    publishedAt: nullableIso(row.publishedAt),
    retrievedAt: iso(row.retrievedAt),
    accessStatus: row.accessStatus as Source["accessStatus"],
    citationLabel: row.citationLabel,
  };
}

export function mapFile(row: FileRow): Artifact {
  return {
    id: row.id,
    projectId: row.projectId,
    taskId: row.taskId,
    runId: row.runId,
    kind: row.kind as Artifact["kind"],
    name: row.name,
    storageKey: row.storageKey,
    contentType: row.contentType,
    contentHash: row.contentHash,
    sizeBytes: row.sizeBytes,
    retentionClass: row.retentionClass as Artifact["retentionClass"],
    createdAt: iso(row.createdAt),
  };
}
