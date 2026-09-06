import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import type { BoundedMetadata, JsonValue } from "@zeal-rsrch/contracts";

const timestamps = () => ({
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
});

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: varchar("title", { length: 160 }).notNull(),
    description: text("description"),
    status: varchar("status", { length: 20 }).$type<"active" | "archived">().default("active").notNull(),
    version: integer("version").default(0).notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true, mode: "date" }),
    ...timestamps(),
  },
  (table) => [
    check("projects_status_check", sql`${table.status} in ('active', 'archived')`),
    check("projects_version_check", sql`${table.version} >= 0`),
    check(
      "projects_archive_consistency_check",
      sql`(${table.status} = 'archived') = (${table.archivedAt} is not null)`,
    ),
    uniqueIndex("projects_active_title_unique")
      .on(sql`lower(${table.title})`)
      .where(sql`${table.archivedAt} is null`),
    index("projects_status_updated_idx").on(table.status, table.updatedAt),
  ],
);

export const promptVersions = pgTable(
  "prompt_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    version: varchar("version", { length: 64 }).notNull(),
    contentHash: varchar("content_hash", { length: 64 }).notNull(),
    template: text("template").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("prompt_versions_name_version_unique").on(table.name, table.version),
    check("prompt_versions_hash_check", sql`${table.contentHash} ~ '^[a-f0-9]{64}$'`),
  ],
);

export const skillVersions = pgTable(
  "skill_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    version: varchar("version", { length: 64 }).notNull(),
    contentHash: varchar("content_hash", { length: 64 }).notNull(),
    path: text("path"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("skill_versions_name_hash_unique").on(table.name, table.contentHash),
    check("skill_versions_hash_check", sql`${table.contentHash} ~ '^[a-f0-9]{64}$'`),
  ],
);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    request: text("request").notNull(),
    status: varchar("status", { length: 20 })
      .$type<
        | "backlog"
        | "queued"
        | "researching"
        | "drafting"
        | "review"
        | "done"
        | "blocked"
        | "failed"
        | "cancelled"
        | "archived"
      >()
      .default("backlog")
      .notNull(),
    priority: varchar("priority", { length: 10 }).$type<"low" | "medium" | "high">().default("medium").notNull(),
    currentPhase: varchar("current_phase", { length: 30 }),
    blockedReason: text("blocked_reason"),
    codexThreadId: varchar("codex_thread_id", { length: 255 }),
    skillName: varchar("skill_name", { length: 64 }).default("research-journalist").notNull(),
    promptVersionId: uuid("prompt_version_id").references(() => promptVersions.id, { onDelete: "restrict" }),
    skillVersionId: uuid("skill_version_id").references(() => skillVersions.id, { onDelete: "restrict" }),
    version: integer("version").default(0).notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true, mode: "date" }),
    ...timestamps(),
  },
  (table) => [
    check(
      "tasks_status_check",
      sql`${table.status} in ('backlog', 'queued', 'researching', 'drafting', 'review', 'done', 'blocked', 'failed', 'cancelled', 'archived')`,
    ),
    check("tasks_priority_check", sql`${table.priority} in ('low', 'medium', 'high')`),
    check(
      "tasks_phase_check",
      sql`${table.currentPhase} is null or ${table.currentPhase} in ('queued', 'planning', 'searching', 'reading', 'drafting', 'verifying', 'cleaning_up', 'awaiting_approval', 'complete')`,
    ),
    check("tasks_version_check", sql`${table.version} >= 0`),
    check(
      "tasks_archive_consistency_check",
      sql`(${table.status} = 'archived') = (${table.archivedAt} is not null)`,
    ),
    check(
      "tasks_blocked_reason_check",
      sql`${table.status} <> 'blocked' or nullif(btrim(${table.blockedReason}), '') is not null`,
    ),
    index("tasks_project_status_updated_idx").on(table.projectId, table.status, table.updatedAt),
    index("tasks_codex_thread_idx").on(table.codexThreadId),
  ],
);

export const researchRuns = pgTable(
  "research_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    jobId: varchar("job_id", { length: 255 }),
    status: varchar("status", { length: 20 })
      .$type<"queued" | "running" | "blocked" | "completed" | "failed" | "cancelled">()
      .default("queued")
      .notNull(),
    attempt: integer("attempt").default(1).notNull(),
    parentRunId: uuid("parent_run_id").references((): AnyPgColumn => researchRuns.id, { onDelete: "set null" }),
    promptVersionId: uuid("prompt_version_id").references(() => promptVersions.id, { onDelete: "restrict" }),
    skillVersionId: uuid("skill_version_id").references(() => skillVersions.id, { onDelete: "restrict" }),
    codexThreadId: varchar("codex_thread_id", { length: 255 }),
    codexTurnId: varchar("codex_turn_id", { length: 255 }),
    traceId: varchar("trace_id", { length: 64 }),
    model: varchar("model", { length: 128 }),
    terminalCode: varchar("terminal_code", { length: 100 }),
    startedAt: timestamp("started_at", { withTimezone: true, mode: "date" }),
    finishedAt: timestamp("finished_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    check(
      "research_runs_status_check",
      sql`${table.status} in ('queued', 'running', 'blocked', 'completed', 'failed', 'cancelled')`,
    ),
    check("research_runs_attempt_check", sql`${table.attempt} > 0`),
    uniqueIndex("research_runs_job_id_unique").on(table.jobId).where(sql`${table.jobId} is not null`),
    index("research_runs_task_created_idx").on(table.taskId, table.createdAt),
    index("research_runs_status_created_idx").on(table.status, table.createdAt),
  ],
);

export const runEvents = pgTable(
  "run_events",
  {
    id: bigint("id", { mode: "bigint" }).primaryKey().generatedAlwaysAsIdentity(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    runId: uuid("run_id").references(() => researchRuns.id, { onDelete: "cascade" }),
    jobId: varchar("job_id", { length: 255 }),
    codexThreadId: varchar("codex_thread_id", { length: 255 }),
    codexTurnId: varchar("codex_turn_id", { length: 255 }),
    traceId: varchar("trace_id", { length: 64 }),
    skillVersion: varchar("skill_version", { length: 128 }),
    promptVersion: varchar("prompt_version", { length: 128 }),
    model: varchar("model", { length: 128 }),
    applicationVersion: varchar("application_version", { length: 64 }),
    type: varchar("type", { length: 64 }).notNull(),
    message: varchar("message", { length: 1000 }).notNull(),
    metadata: jsonb("metadata").$type<BoundedMetadata>().default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    check(
      "run_events_type_check",
      sql`${table.type} in ('task_created', 'task_queued', 'codex_thread_started', 'planning_started', 'search_started', 'source_found', 'source_read', 'draft_started', 'verification_started', 'approval_requested', 'approval_resolved', 'cleanup_started', 'cleanup_completed', 'report_saved', 'task_completed', 'task_failed', 'task_blocked', 'task_cancelled')`,
    ),
    check("run_events_metadata_size_check", sql`octet_length(${table.metadata}::text) <= 16384`),
    index("run_events_project_id_idx").on(table.projectId, table.id),
    index("run_events_task_id_idx").on(table.taskId, table.id),
    index("run_events_run_id_idx").on(table.runId, table.id),
    index("run_events_created_at_idx").on(table.createdAt),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    runId: uuid("run_id").references(() => researchRuns.id, { onDelete: "set null" }),
    role: varchar("role", { length: 20 }).$type<"user" | "assistant">().notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    check("messages_role_check", sql`${table.role} in ('user', 'assistant')`),
    index("messages_task_created_idx").on(table.taskId, table.createdAt),
  ],
);

export const sources = pgTable(
  "sources",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    runId: uuid("run_id")
      .notNull()
      .references(() => researchRuns.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 30 }).notNull(),
    url: text("url"),
    title: varchar("title", { length: 500 }).notNull(),
    publisher: varchar("publisher", { length: 300 }),
    author: varchar("author", { length: 300 }),
    publishedAt: timestamp("published_at", { withTimezone: true, mode: "date" }),
    retrievedAt: timestamp("retrieved_at", { withTimezone: true, mode: "date" }).notNull(),
    accessStatus: varchar("access_status", { length: 30 }).notNull(),
    citationLabel: varchar("citation_label", { length: 100 }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    check(
      "sources_type_check",
      sql`${table.type} in ('webpage', 'paper', 'document', 'filing', 'dataset', 'book', 'other')`,
    ),
    check(
      "sources_access_status_check",
      sql`${table.accessStatus} in ('available', 'metadata_only', 'blocked', 'unavailable')`,
    ),
    check("sources_url_scheme_check", sql`${table.url} is null or ${table.url} ~* '^https?://'`),
    index("sources_task_run_idx").on(table.taskId, table.runId),
    index("sources_url_idx").on(table.url),
  ],
);

export const files = pgTable(
  "files",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }),
    runId: uuid("run_id").references(() => researchRuns.id, { onDelete: "set null" }),
    kind: varchar("kind", { length: 30 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    storageKey: text("storage_key").notNull(),
    contentType: varchar("content_type", { length: 255 }).notNull(),
    contentHash: varchar("content_hash", { length: 64 }).notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    retentionClass: varchar("retention_class", { length: 40 }).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "date" }),
    ...timestamps(),
  },
  (table) => [
    check("files_kind_check", sql`${table.kind} in ('report', 'manifest', 'audit', 'upload', 'temporary')`),
    check(
      "files_retention_class_check",
      sql`${table.retentionClass} in ('final_report', 'source_manifest', 'cleanup_audit', 'user_file', 'temporary_scrape', 'temporary_notes')`,
    ),
    check("files_hash_check", sql`${table.contentHash} ~ '^[a-f0-9]{64}$'`),
    check("files_size_check", sql`${table.sizeBytes} >= 0`),
    check(
      "files_storage_key_check",
      sql`${table.storageKey} !~ '(^/|(^|/)\\.\\.(/|$)|\\\\)' and ${table.storageKey} <> ''`,
    ),
    uniqueIndex("files_storage_key_unique").on(table.storageKey),
    index("files_project_created_idx").on(table.projectId, table.createdAt),
    index("files_task_created_idx").on(table.taskId, table.createdAt),
  ],
);

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    runId: uuid("run_id")
      .notNull()
      .references(() => researchRuns.id, { onDelete: "cascade" }),
    fileId: uuid("file_id")
      .notNull()
      .references(() => files.id, { onDelete: "restrict" }),
    title: varchar("title", { length: 500 }).notNull(),
    version: integer("version").default(1).notNull(),
    previousReportId: uuid("previous_report_id").references((): AnyPgColumn => reports.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    check("reports_version_check", sql`${table.version} > 0`),
    uniqueIndex("reports_file_id_unique").on(table.fileId),
    uniqueIndex("reports_task_version_unique").on(table.taskId, table.version),
    index("reports_project_created_idx").on(table.projectId, table.createdAt),
  ],
);

export const cleanupAudits = pgTable(
  "cleanup_audits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    runId: uuid("run_id")
      .notNull()
      .references(() => researchRuns.id, { onDelete: "cascade" }),
    auditFileId: uuid("audit_file_id").references(() => files.id, { onDelete: "set null" }),
    status: varchar("status", { length: 20 }).$type<"complete" | "partial" | "failed">().notNull(),
    deletedItems: jsonb("deleted_items").$type<JsonValue[]>().default([]).notNull(),
    retainedItems: jsonb("retained_items").$type<JsonValue[]>().default([]).notNull(),
    failedItems: jsonb("failed_items").$type<JsonValue[]>().default([]).notNull(),
    startedAt: timestamp("started_at", { withTimezone: true, mode: "date" }).notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    check("cleanup_audits_status_check", sql`${table.status} in ('complete', 'partial', 'failed')`),
    uniqueIndex("cleanup_audits_run_id_unique").on(table.runId),
    index("cleanup_audits_task_created_idx").on(table.taskId, table.createdAt),
  ],
);

export const approvalRequests = pgTable(
  "approval_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    runId: uuid("run_id")
      .notNull()
      .references(() => researchRuns.id, { onDelete: "cascade" }),
    codexThreadId: varchar("codex_thread_id", { length: 255 }).notNull(),
    codexTurnId: varchar("codex_turn_id", { length: 255 }).notNull(),
    codexItemId: varchar("codex_item_id", { length: 255 }).notNull(),
    serverRequestId: varchar("server_request_id", { length: 255 }).notNull(),
    kind: varchar("kind", { length: 40 }).notNull(),
    status: varchar("status", { length: 20 }).default("pending").notNull(),
    reason: text("reason"),
    actionSummary: varchar("action_summary", { length: 4000 }).notNull(),
    decision: varchar("decision", { length: 30 }),
    requestedAt: timestamp("requested_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true, mode: "date" }),
  },
  (table) => [
    check(
      "approval_requests_kind_check",
      sql`${table.kind} in ('command_execution', 'file_change', 'permissions', 'network_access', 'mcp_tool', 'user_input')`,
    ),
    check(
      "approval_requests_status_check",
      sql`${table.status} in ('pending', 'accepted', 'declined', 'cancelled', 'expired')`,
    ),
    check(
      "approval_requests_decision_check",
      sql`${table.decision} is null or ${table.decision} in ('accept', 'accept_for_session', 'decline', 'cancel')`,
    ),
    uniqueIndex("approval_requests_server_request_unique").on(table.runId, table.serverRequestId),
    index("approval_requests_task_status_idx").on(table.taskId, table.status),
  ],
);

export type DatabaseSchema = {
  projects: typeof projects;
  promptVersions: typeof promptVersions;
  skillVersions: typeof skillVersions;
  tasks: typeof tasks;
  researchRuns: typeof researchRuns;
  runEvents: typeof runEvents;
  messages: typeof messages;
  sources: typeof sources;
  files: typeof files;
  reports: typeof reports;
  cleanupAudits: typeof cleanupAudits;
  approvalRequests: typeof approvalRequests;
};
