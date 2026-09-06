CREATE TABLE "approval_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"run_id" uuid NOT NULL,
	"codex_thread_id" varchar(255) NOT NULL,
	"codex_turn_id" varchar(255) NOT NULL,
	"codex_item_id" varchar(255) NOT NULL,
	"server_request_id" varchar(255) NOT NULL,
	"kind" varchar(40) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"reason" text,
	"action_summary" varchar(4000) NOT NULL,
	"decision" varchar(30),
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	CONSTRAINT "approval_requests_kind_check" CHECK ("approval_requests"."kind" in ('command_execution', 'file_change', 'permissions', 'network_access', 'mcp_tool', 'user_input')),
	CONSTRAINT "approval_requests_status_check" CHECK ("approval_requests"."status" in ('pending', 'accepted', 'declined', 'cancelled', 'expired'))
);
--> statement-breakpoint
CREATE TABLE "cleanup_audits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"run_id" uuid NOT NULL,
	"audit_file_id" uuid,
	"status" varchar(20) NOT NULL,
	"deleted_items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"retained_items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"failed_items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cleanup_audits_status_check" CHECK ("cleanup_audits"."status" in ('complete', 'partial', 'failed'))
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"task_id" uuid,
	"run_id" uuid,
	"kind" varchar(30) NOT NULL,
	"name" varchar(255) NOT NULL,
	"storage_key" text NOT NULL,
	"content_type" varchar(255) NOT NULL,
	"content_hash" varchar(64) NOT NULL,
	"size_bytes" bigint NOT NULL,
	"retention_class" varchar(40) NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "files_kind_check" CHECK ("files"."kind" in ('report', 'manifest', 'audit', 'upload', 'temporary')),
	CONSTRAINT "files_retention_class_check" CHECK ("files"."retention_class" in ('final_report', 'source_manifest', 'cleanup_audit', 'user_file', 'temporary_scrape', 'temporary_notes')),
	CONSTRAINT "files_hash_check" CHECK ("files"."content_hash" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "files_size_check" CHECK ("files"."size_bytes" >= 0)
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"run_id" uuid,
	"role" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "messages_role_check" CHECK ("messages"."role" in ('user', 'assistant'))
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(160) NOT NULL,
	"description" text,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_status_check" CHECK ("projects"."status" in ('active', 'archived')),
	CONSTRAINT "projects_version_check" CHECK ("projects"."version" >= 0)
);
--> statement-breakpoint
CREATE TABLE "prompt_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"version" varchar(64) NOT NULL,
	"content_hash" varchar(64) NOT NULL,
	"template" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "prompt_versions_hash_check" CHECK ("prompt_versions"."content_hash" ~ '^[a-f0-9]{64}$')
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"run_id" uuid NOT NULL,
	"file_id" uuid NOT NULL,
	"title" varchar(500) NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"previous_report_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reports_version_check" CHECK ("reports"."version" > 0)
);
--> statement-breakpoint
CREATE TABLE "research_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"job_id" varchar(255),
	"status" varchar(20) DEFAULT 'queued' NOT NULL,
	"attempt" integer DEFAULT 1 NOT NULL,
	"parent_run_id" uuid,
	"prompt_version_id" uuid,
	"skill_version_id" uuid,
	"codex_thread_id" varchar(255),
	"codex_turn_id" varchar(255),
	"trace_id" varchar(64),
	"model" varchar(128),
	"terminal_code" varchar(100),
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "research_runs_status_check" CHECK ("research_runs"."status" in ('queued', 'running', 'blocked', 'completed', 'failed', 'cancelled')),
	CONSTRAINT "research_runs_attempt_check" CHECK ("research_runs"."attempt" > 0)
);
--> statement-breakpoint
CREATE TABLE "run_events" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "run_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"project_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"run_id" uuid,
	"job_id" varchar(255),
	"codex_thread_id" varchar(255),
	"codex_turn_id" varchar(255),
	"trace_id" varchar(64),
	"skill_version" varchar(128),
	"prompt_version" varchar(128),
	"model" varchar(128),
	"application_version" varchar(64),
	"type" varchar(64) NOT NULL,
	"message" varchar(1000) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"version" varchar(64) NOT NULL,
	"content_hash" varchar(64) NOT NULL,
	"path" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "skill_versions_hash_check" CHECK ("skill_versions"."content_hash" ~ '^[a-f0-9]{64}$')
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"run_id" uuid NOT NULL,
	"type" varchar(30) NOT NULL,
	"url" text,
	"title" varchar(500) NOT NULL,
	"publisher" varchar(300),
	"author" varchar(300),
	"published_at" timestamp with time zone,
	"retrieved_at" timestamp with time zone NOT NULL,
	"access_status" varchar(30) NOT NULL,
	"citation_label" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sources_type_check" CHECK ("sources"."type" in ('webpage', 'paper', 'document', 'filing', 'dataset', 'book', 'other')),
	CONSTRAINT "sources_access_status_check" CHECK ("sources"."access_status" in ('available', 'metadata_only', 'blocked', 'unavailable'))
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"request" text NOT NULL,
	"status" varchar(20) DEFAULT 'backlog' NOT NULL,
	"priority" varchar(10) DEFAULT 'medium' NOT NULL,
	"current_phase" varchar(30),
	"blocked_reason" text,
	"codex_thread_id" varchar(255),
	"skill_name" varchar(64) DEFAULT 'research-journalist' NOT NULL,
	"prompt_version_id" uuid,
	"skill_version_id" uuid,
	"version" integer DEFAULT 0 NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tasks_status_check" CHECK ("tasks"."status" in ('backlog', 'queued', 'researching', 'drafting', 'review', 'done', 'blocked', 'failed', 'cancelled', 'archived')),
	CONSTRAINT "tasks_priority_check" CHECK ("tasks"."priority" in ('low', 'medium', 'high')),
	CONSTRAINT "tasks_phase_check" CHECK ("tasks"."current_phase" is null or "tasks"."current_phase" in ('queued', 'planning', 'searching', 'reading', 'drafting', 'verifying', 'cleaning_up', 'awaiting_approval', 'complete')),
	CONSTRAINT "tasks_version_check" CHECK ("tasks"."version" >= 0)
);
--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_run_id_research_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."research_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cleanup_audits" ADD CONSTRAINT "cleanup_audits_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cleanup_audits" ADD CONSTRAINT "cleanup_audits_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cleanup_audits" ADD CONSTRAINT "cleanup_audits_run_id_research_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."research_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cleanup_audits" ADD CONSTRAINT "cleanup_audits_audit_file_id_files_id_fk" FOREIGN KEY ("audit_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_run_id_research_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."research_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_run_id_research_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."research_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_run_id_research_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."research_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_previous_report_id_reports_id_fk" FOREIGN KEY ("previous_report_id") REFERENCES "public"."reports"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_runs" ADD CONSTRAINT "research_runs_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_runs" ADD CONSTRAINT "research_runs_parent_run_id_research_runs_id_fk" FOREIGN KEY ("parent_run_id") REFERENCES "public"."research_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_runs" ADD CONSTRAINT "research_runs_prompt_version_id_prompt_versions_id_fk" FOREIGN KEY ("prompt_version_id") REFERENCES "public"."prompt_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_runs" ADD CONSTRAINT "research_runs_skill_version_id_skill_versions_id_fk" FOREIGN KEY ("skill_version_id") REFERENCES "public"."skill_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "run_events" ADD CONSTRAINT "run_events_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "run_events" ADD CONSTRAINT "run_events_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "run_events" ADD CONSTRAINT "run_events_run_id_research_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."research_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_run_id_research_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."research_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_prompt_version_id_prompt_versions_id_fk" FOREIGN KEY ("prompt_version_id") REFERENCES "public"."prompt_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_skill_version_id_skill_versions_id_fk" FOREIGN KEY ("skill_version_id") REFERENCES "public"."skill_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "approval_requests_server_request_unique" ON "approval_requests" USING btree ("run_id","server_request_id");--> statement-breakpoint
CREATE INDEX "approval_requests_task_status_idx" ON "approval_requests" USING btree ("task_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "cleanup_audits_run_id_unique" ON "cleanup_audits" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "cleanup_audits_task_created_idx" ON "cleanup_audits" USING btree ("task_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "files_storage_key_unique" ON "files" USING btree ("storage_key");--> statement-breakpoint
CREATE INDEX "files_project_created_idx" ON "files" USING btree ("project_id","created_at");--> statement-breakpoint
CREATE INDEX "files_task_created_idx" ON "files" USING btree ("task_id","created_at");--> statement-breakpoint
CREATE INDEX "messages_task_created_idx" ON "messages" USING btree ("task_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "projects_active_title_unique" ON "projects" USING btree (lower("title")) WHERE "projects"."archived_at" is null;--> statement-breakpoint
CREATE INDEX "projects_status_updated_idx" ON "projects" USING btree ("status","updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "prompt_versions_name_version_unique" ON "prompt_versions" USING btree ("name","version");--> statement-breakpoint
CREATE UNIQUE INDEX "reports_file_id_unique" ON "reports" USING btree ("file_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reports_task_version_unique" ON "reports" USING btree ("task_id","version");--> statement-breakpoint
CREATE INDEX "reports_project_created_idx" ON "reports" USING btree ("project_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "research_runs_job_id_unique" ON "research_runs" USING btree ("job_id") WHERE "research_runs"."job_id" is not null;--> statement-breakpoint
CREATE INDEX "research_runs_task_created_idx" ON "research_runs" USING btree ("task_id","created_at");--> statement-breakpoint
CREATE INDEX "research_runs_status_created_idx" ON "research_runs" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "run_events_project_id_idx" ON "run_events" USING btree ("project_id","id");--> statement-breakpoint
CREATE INDEX "run_events_task_id_idx" ON "run_events" USING btree ("task_id","id");--> statement-breakpoint
CREATE INDEX "run_events_run_id_idx" ON "run_events" USING btree ("run_id","id");--> statement-breakpoint
CREATE INDEX "run_events_created_at_idx" ON "run_events" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "skill_versions_name_hash_unique" ON "skill_versions" USING btree ("name","content_hash");--> statement-breakpoint
CREATE INDEX "sources_task_run_idx" ON "sources" USING btree ("task_id","run_id");--> statement-breakpoint
CREATE INDEX "sources_url_idx" ON "sources" USING btree ("url");--> statement-breakpoint
CREATE INDEX "tasks_project_status_updated_idx" ON "tasks" USING btree ("project_id","status","updated_at");--> statement-breakpoint
CREATE INDEX "tasks_codex_thread_idx" ON "tasks" USING btree ("codex_thread_id");