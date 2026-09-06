import { access } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { ResearchRunPayload, ResolveApprovalInput, SourceType } from "@zeal-rsrch/contracts";
import { buildResearchPrompt } from "@zeal-rsrch/domain";
import type { createRepositories } from "@zeal-rsrch/db";
import type { LocalStorage } from "@zeal-rsrch/storage";
import { CodexAppServerClient, CodexAppServerError, type AppServerMessage } from "./app-server-client.js";
import type { ResearchExecutor } from "./worker.js";

type Repositories = ReturnType<typeof createRepositories>;
type Decision = ResolveApprovalInput["decision"];
type JsonObject = Record<string, unknown>;

type StructuredSource = {
  type: SourceType;
  title: string;
  url: string | null;
  publisher: string | null;
  author: string | null;
  publishedAt: string | null;
  accessStatus: "available" | "metadata_only" | "blocked" | "unavailable";
  citationLabel: string | null;
};

type StructuredResearchOutput = {
  title: string;
  reportMarkdown: string;
  sources: StructuredSource[];
};

type ActiveTurn = {
  client: CodexAppServerClient;
  threadId: string;
  turnId: string;
};

export type CodexResearchExecutorOptions = {
  workspaceRoot?: string;
  command?: string;
  model?: string;
  effort?: "low" | "medium" | "high" | "xhigh";
  approvalPollMs?: number;
};

const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    reportMarkdown: { type: "string" },
    sources: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { enum: ["webpage", "paper", "document", "filing", "dataset", "book", "other"] },
          title: { type: "string" },
          url: { type: ["string", "null"] },
          publisher: { type: ["string", "null"] },
          author: { type: ["string", "null"] },
          publishedAt: { type: ["string", "null"] },
          accessStatus: { enum: ["available", "metadata_only", "blocked", "unavailable"] },
          citationLabel: { type: ["string", "null"] },
        },
        required: ["type", "title", "url", "publisher", "author", "publishedAt", "accessStatus", "citationLabel"],
        additionalProperties: false,
      },
    },
  },
  required: ["title", "reportMarkdown", "sources"],
  additionalProperties: false,
} as const;

export class CodexResearchExecutor implements ResearchExecutor {
  private readonly active = new Map<string, ActiveTurn>();
  private readonly workspaceRoot: string;
  private readonly approvalPollMs: number;

  constructor(
    private readonly repositories: Repositories,
    private readonly storage: LocalStorage,
    private readonly options: CodexResearchExecutorOptions = {},
  ) {
    const repositoryRoot = fileURLToPath(new URL("../../..", import.meta.url));
    this.workspaceRoot = resolve(options.workspaceRoot ?? repositoryRoot);
    this.approvalPollMs = Math.max(options.approvalPollMs ?? 750, 100);
  }

  async run(payload: ResearchRunPayload, signal: AbortSignal): Promise<{ codexThreadId?: string; codexTurnId?: string }> {
    const task = await this.repositories.tasks.get(payload.taskId);
    return this.execute(payload, task?.codexThreadId ?? undefined, signal);
  }

  resume(
    payload: ResearchRunPayload & { codexThreadId: string },
    signal: AbortSignal,
  ): Promise<{ codexThreadId?: string; codexTurnId?: string }> {
    return this.execute(payload, payload.codexThreadId, signal);
  }

  async cancel(taskId: string): Promise<void> {
    const active = this.active.get(taskId);
    if (!active) return;
    await active.client.request("turn/interrupt", {
      threadId: active.threadId,
      turnId: active.turnId,
    });
  }

  private async execute(
    payload: ResearchRunPayload,
    existingThreadId: string | undefined,
    signal: AbortSignal,
  ): Promise<{ codexThreadId: string; codexTurnId: string }> {
    const task = await this.repositories.tasks.get(payload.taskId);
    if (!task) throw codedError("invalid_request", "Research task was not found");
    const project = await this.repositories.projects.get(task.projectId);
    if (!project) throw codedError("invalid_request", "Research project was not found");

    const prompt = buildResearchPrompt({
      projectTitle: project.title,
      taskTitle: task.title,
      request: task.request,
      skillName: task.skillName,
    });
    const existingMessages = await this.repositories.messages.listForTask(task.id);
    if (!existingMessages.some((message) => message.runId === payload.runId && message.role === "user")) {
      await this.repositories.messages.create({
        taskId: task.id,
        runId: payload.runId,
        role: "user",
        content: task.request,
      });
    }

    let threadId = existingThreadId;
    let turnId: string | undefined;
    let finalText = "";
    let terminalStatus: string | undefined;
    let terminalError: unknown;
    let resolveCompleted!: () => void;
    const completed = new Promise<void>((resolvePromise) => { resolveCompleted = resolvePromise; });
    const emitted = new Set<string>();

    const client = new CodexAppServerClient({
      command: this.options.command,
      cwd: this.workspaceRoot,
      onNotification: async (message) => {
        const params = message.params ?? {};
        if (message.method === "item/completed") {
          const item = asObject(params.item);
          if (item?.type === "agentMessage" && typeof item.text === "string") finalText = item.text;
        }
        if (message.method === "item/agentMessage/delta" && typeof params.delta === "string") {
          finalText += params.delta;
        }
        if (message.method === "turn/completed") {
          const turn = asObject(params.turn);
          if (!turnId || turn?.id === turnId) {
            terminalStatus = typeof turn?.status === "string" ? turn.status : "failed";
            terminalError = turn?.error;
            resolveCompleted();
          }
        }
        await this.persistProgress(message, payload, task.projectId, threadId, turnId, emitted);
      },
      onServerRequest: (message) => this.handleApproval(message, payload, task.projectId, signal),
    });

    const abort = () => {
      const active = this.active.get(task.id);
      if (active) void this.cancel(task.id);
      else resolveCompleted();
    };
    signal.addEventListener("abort", abort, { once: true });

    try {
      if (signal.aborted) throw codedError("cancelled", "Research execution was cancelled");
      await client.initialize();
      const threadResponse = existingThreadId
        ? await client.request<{ thread: { id: string }; model?: string }>("thread/resume", {
            threadId: existingThreadId,
            cwd: this.workspaceRoot,
            approvalPolicy: "on-request",
            sandbox: "workspace-write",
          })
        : await client.request<{ thread: { id: string }; model?: string }>("thread/start", {
            cwd: this.workspaceRoot,
            approvalPolicy: "on-request",
            sandbox: "workspace-write",
            serviceName: "zeal_rsrch",
            ...(this.options.model ? { model: this.options.model } : {}),
          });
      threadId = threadResponse.thread.id;
      await Promise.all([
        this.repositories.tasks.updateCodexThread(task.id, threadId),
        this.repositories.runs.update(payload.runId, {
          codexThreadId: threadId,
          model: threadResponse.model ?? this.options.model ?? null,
        }),
        this.repositories.events.append({
          projectId: task.projectId,
          taskId: task.id,
          runId: payload.runId,
          codexThreadId: threadId,
          type: "codex_thread_started",
          message: existingThreadId ? "Codex research thread resumed" : "Codex research thread started",
          metadata: {},
        }),
      ]);

      const input: JsonObject[] = [{ type: "text", text: prompt }];
      const skillPath = resolve(this.workspaceRoot, "skills", task.skillName, "SKILL.md");
      if (await pathExists(skillPath)) input.push({ type: "skill", name: task.skillName, path: skillPath });
      const turnResponse = await client.request<{ turn: { id: string } }>("turn/start", {
        threadId,
        input,
        cwd: this.workspaceRoot,
        approvalPolicy: "on-request",
        effort: this.options.effort ?? "medium",
        outputSchema: OUTPUT_SCHEMA,
      });
      turnId = turnResponse.turn.id;
      this.active.set(task.id, { client, threadId, turnId });
      await this.repositories.runs.update(payload.runId, { codexThreadId: threadId, codexTurnId: turnId });

      await Promise.race([completed, client.waitForUnexpectedExit()]);
      if (signal.aborted || terminalStatus === "interrupted") {
        throw codedError("cancelled", "Research execution was cancelled");
      }
      if (terminalStatus !== "completed") {
        throw classifyCodexFailure(terminalError);
      }
      if (!finalText.trim()) throw codedError("codex_protocol_mismatch", "Codex completed without a final response");

      const output = parseResearchOutput(finalText, task.title);
      await this.persistOutput(payload, task.projectId, task.id, output);
      return { codexThreadId: threadId, codexTurnId: turnId };
    } finally {
      signal.removeEventListener("abort", abort);
      this.active.delete(task.id);
      await client.close();
    }
  }

  private async persistProgress(
    message: AppServerMessage,
    payload: ResearchRunPayload,
    projectId: string,
    threadId: string | undefined,
    turnId: string | undefined,
    emitted: Set<string>,
  ): Promise<void> {
    const item = asObject(message.params?.item);
    const progress =
      message.method === "turn/plan/updated"
        ? { key: "planning", type: "planning_started" as const, message: "Codex updated the research plan" }
        : message.method === "item/started" && item?.type === "webSearch"
          ? { key: "searching", type: "search_started" as const, message: "Codex started web research" }
          : message.method === "item/started" && item?.type === "agentMessage"
            ? { key: "drafting", type: "draft_started" as const, message: "Codex started drafting the research report" }
            : null;
    if (!progress || emitted.has(progress.key)) return;
    emitted.add(progress.key);
    await this.repositories.events.append({
      projectId,
      taskId: payload.taskId,
      runId: payload.runId,
      codexThreadId: threadId,
      codexTurnId: turnId,
      type: progress.type,
      message: progress.message,
      metadata: {},
    });
  }

  private async handleApproval(
    message: AppServerMessage & { id: string | number },
    payload: ResearchRunPayload,
    projectId: string,
    signal: AbortSignal,
  ): Promise<unknown> {
    const params = message.params ?? {};
    const threadId = requiredString(params.threadId, "threadId");
    const turnId = requiredString(params.turnId, "turnId");
    const itemId = requiredString(params.itemId, "itemId");
    const kind = approvalKind(message.method, params);
    const actionSummary = approvalSummary(message.method, params);
    const approval = await this.repositories.approvals.create({
      taskId: payload.taskId,
      runId: payload.runId,
      codexThreadId: threadId,
      codexTurnId: turnId,
      codexItemId: itemId,
      serverRequestId: message.id,
      kind,
      reason: typeof params.reason === "string" ? params.reason.slice(0, 2_000) : null,
      actionSummary,
    });
    await Promise.all([
      this.repositories.runs.update(payload.runId, { status: "blocked" }),
      this.transitionTask(payload.taskId, "blocked", "awaiting_approval", "task_blocked", "Codex is waiting for operator approval", "Codex approval required"),
      this.repositories.events.append({
        projectId,
        taskId: payload.taskId,
        runId: payload.runId,
        codexThreadId: threadId,
        codexTurnId: turnId,
        type: "approval_requested",
        message: "Codex requested operator approval",
        metadata: { approvalId: approval.id, kind },
      }),
    ]);

    const decision = await this.waitForDecision(approval.id, signal);
    await Promise.all([
      this.repositories.runs.update(payload.runId, { status: "running" }),
      this.transitionTask(payload.taskId, "researching", "planning", "planning_started", "Research resumed after approval"),
      this.repositories.events.append({
        projectId,
        taskId: payload.taskId,
        runId: payload.runId,
        codexThreadId: threadId,
        codexTurnId: turnId,
        type: "approval_resolved",
        message: `Operator ${decision === "accept" || decision === "accept_for_session" ? "approved" : "declined"} the Codex request`,
        metadata: { approvalId: approval.id, decision },
      }),
    ]);
    return approvalResponse(message.method, params, decision);
  }

  private async waitForDecision(approvalId: string, signal: AbortSignal): Promise<Decision> {
    while (!signal.aborted) {
      const approval = await this.repositories.approvals.get(approvalId);
      if (!approval) throw codedError("approval_denied", "Approval record disappeared");
      if (approval.status !== "pending") return approval.decision ?? "cancel";
      await wait(this.approvalPollMs, signal);
    }
    return "cancel";
  }

  private async transitionTask(
    taskId: string,
    status: "blocked" | "researching",
    phase: "awaiting_approval" | "planning",
    eventType: "task_blocked" | "planning_started",
    eventMessage: string,
    blockedReason?: string,
  ): Promise<void> {
    const task = await this.repositories.tasks.get(taskId);
    if (!task || task.status === status) return;
    await this.repositories.tasks.transition(taskId, {
      expectedVersion: task.version,
      status,
      phase,
      blockedReason: status === "blocked" ? blockedReason : null,
      eventType,
      eventMessage,
    });
  }

  private async persistOutput(
    payload: ResearchRunPayload,
    projectId: string,
    taskId: string,
    output: StructuredResearchOutput,
  ): Promise<void> {
    await this.repositories.messages.create({ taskId, runId: payload.runId, role: "assistant", content: output.reportMarkdown });
    for (const source of output.sources) {
      await this.repositories.sources.create({
        taskId,
        runId: payload.runId,
        type: source.type,
        title: source.title.slice(0, 500),
        url: validHttpUrl(source.url),
        publisher: source.publisher?.slice(0, 300) ?? null,
        author: source.author?.slice(0, 300) ?? null,
        publishedAt: validDate(source.publishedAt),
        retrievedAt: new Date(),
        accessStatus: source.accessStatus,
        citationLabel: source.citationLabel?.slice(0, 100) ?? null,
      });
    }

    const reportKey = `projects/${projectId}/reports/${payload.runId}.md`;
    const reportObject = await this.storage.put(reportKey, output.reportMarkdown, "text/markdown");
    const reportFile = await this.repositories.files.create({
      projectId,
      taskId,
      runId: payload.runId,
      kind: "report",
      name: `${safeName(output.title)}.md`,
      ...reportObject,
      retentionClass: "final_report",
    });
    const priorReports = await this.repositories.reports.listForTask(taskId);
    await this.repositories.reports.create({
      projectId,
      taskId,
      runId: payload.runId,
      fileId: reportFile.id,
      title: output.title.slice(0, 500),
      version: (priorReports[0]?.version ?? 0) + 1,
      previousReportId: priorReports[0]?.id ?? null,
    });

    const manifestKey = `projects/${projectId}/manifests/${payload.runId}.json`;
    const manifestObject = await this.storage.put(
      manifestKey,
      `${JSON.stringify({ sources: output.sources }, null, 2)}\n`,
      "application/json",
    );
    await this.repositories.files.create({
      projectId,
      taskId,
      runId: payload.runId,
      kind: "manifest",
      name: `${payload.runId}-sources.json`,
      ...manifestObject,
      retentionClass: "source_manifest",
    });
    await this.repositories.events.append({
      projectId,
      taskId,
      runId: payload.runId,
      type: "report_saved",
      message: "Research report and source manifest saved",
      metadata: { reportFileId: reportFile.id, sourceCount: output.sources.length },
    });
  }
}

function parseResearchOutput(text: string, fallbackTitle: string): StructuredResearchOutput {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    const value = JSON.parse(trimmed) as JsonObject;
    if (typeof value.reportMarkdown !== "string" || !value.reportMarkdown.trim()) throw new Error("missing report");
    return {
      title: typeof value.title === "string" && value.title.trim() ? value.title.trim() : fallbackTitle,
      reportMarkdown: value.reportMarkdown.trim(),
      sources: Array.isArray(value.sources) ? value.sources.filter(isStructuredSource).slice(0, 500) : [],
    };
  } catch {
    return { title: fallbackTitle, reportMarkdown: text.trim(), sources: [] };
  }
}

function isStructuredSource(value: unknown): value is StructuredSource {
  const source = asObject(value);
  return Boolean(
    source &&
      typeof source.title === "string" &&
      ["webpage", "paper", "document", "filing", "dataset", "book", "other"].includes(String(source.type)) &&
      ["available", "metadata_only", "blocked", "unavailable"].includes(String(source.accessStatus)) &&
      [source.url, source.publisher, source.author, source.publishedAt, source.citationLabel].every(
        (field) => field === null || typeof field === "string",
      ),
  );
}

function approvalKind(method: string, params: JsonObject) {
  if (method === "item/fileChange/requestApproval") return "file_change" as const;
  if (method === "item/permissions/requestApproval") return "permissions" as const;
  if (method === "item/tool/requestUserInput") return "user_input" as const;
  if (method === "mcpServer/elicitation/request") return "mcp_tool" as const;
  if (params.networkApprovalContext) return "network_access" as const;
  return "command_execution" as const;
}

function approvalSummary(method: string, params: JsonObject): string {
  if (method === "item/commandExecution/requestApproval") {
    if (params.networkApprovalContext) return "Allow Codex network access for this research step";
    return typeof params.command === "string" ? `Run command: ${params.command}`.slice(0, 4_000) : "Run a Codex command";
  }
  if (method === "item/fileChange/requestApproval") return "Allow Codex to modify workspace files";
  if (method === "item/permissions/requestApproval") return "Grant additional Codex permissions";
  return "Respond to a Codex tool request";
}

function approvalResponse(method: string, params: JsonObject, decision: Decision): unknown {
  const wireDecision = decision === "accept_for_session" ? "acceptForSession" : decision;
  if (method === "item/commandExecution/requestApproval" || method === "item/fileChange/requestApproval") {
    return { decision: wireDecision };
  }
  if (method === "item/permissions/requestApproval") {
    const requested = asObject(params.permissions);
    const accepted = decision === "accept" || decision === "accept_for_session";
    return {
      permissions: accepted
        ? Object.fromEntries(Object.entries(requested ?? {}).filter(([, value]) => value != null))
        : {},
      scope: decision === "accept_for_session" ? "session" : "turn",
    };
  }
  if (method === "mcpServer/elicitation/request") return { action: "decline", content: null, _meta: null };
  if (method === "item/tool/requestUserInput") return { answers: {} };
  throw codedError("codex_protocol_mismatch", `Unsupported Codex server request: ${method}`);
}

function classifyCodexFailure(value: unknown): Error {
  const error = asObject(value);
  const info = asObject(error?.codexErrorInfo);
  const kind = typeof info?.type === "string" ? info.type : typeof error?.message === "string" ? error.message : "";
  if (/connection|disconnect|unavailable|timeout/i.test(kind)) return codedError("codex_unavailable", "Codex connection failed");
  return codedError("codex_protocol_mismatch", "Codex research turn failed");
}

function codedError(code: string, message: string): Error & { code: string } {
  return Object.assign(new Error(message), { code });
}

function asObject(value: unknown): JsonObject | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : null;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value) throw new CodexAppServerError("codex_protocol_mismatch", `Missing ${field}`);
  return value;
}

async function pathExists(path: string): Promise<boolean> {
  try { await access(path); return true; } catch { return false; }
}

function validHttpUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function validDate(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date;
}

function safeName(value: string): string {
  const safe = value.trim().replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 220);
  return safe || "research-report";
}

function wait(milliseconds: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolvePromise) => {
    const timer = setTimeout(resolvePromise, milliseconds);
    signal.addEventListener("abort", () => { clearTimeout(timer); resolvePromise(); }, { once: true });
  });
}
