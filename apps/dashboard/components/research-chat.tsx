"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Play, Send, ShieldCheck, Square } from "lucide-react";
import type { ApprovalRequest, Message, Project, ResearchRun, RunEvent, Source, Task } from "@zeal-rsrch/contracts";
import { StatusPill } from "@/components/status-pill";

type Report = { id: string; title: string; version: number };
type CleanupAudit = { status: "complete" | "partial" | "failed"; deletedItems: unknown[]; failedItems: unknown[] };

type Props = {
  project: Project;
  tasks: Task[];
  task: Task | null;
  messages: Message[];
  events: RunEvent[];
  runs: ResearchRun[];
  approvals: ApprovalRequest[];
  reports: Report[];
  sources: Source[];
  cleanupAudit: CleanupAudit | null;
};

const phases = ["queued", "planning", "searching", "reading", "drafting", "verifying", "cleaning_up", "complete"];

export function ResearchChat(props: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [request, setRequest] = useState(props.task?.request ?? "");
  const activeRun = props.runs.find((run) => ["queued", "running", "blocked"].includes(run.status));

  useEffect(() => {
    if (!props.task) return;
    const stream = new EventSource(`/api/tasks/${props.task.id}/events`);
    const refresh = () => router.refresh();
    stream.onmessage = refresh;
    for (const type of ["planning_started", "search_started", "draft_started", "approval_requested", "approval_resolved", "report_saved", "task_failed", "task_cancelled"]) stream.addEventListener(type, refresh);
    return () => stream.close();
  }, [props.task, router]);

  async function perform(url: string, init: RequestInit) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(url, init);
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error?.message ?? "The request failed");
      router.refresh();
      return body;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The request failed");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function start() {
    if (props.task) await perform(`/api/tasks/${props.task.id}/research`, { method: "POST" });
  }

  async function cancel() {
    if (props.task) await perform(`/api/tasks/${props.task.id}/research`, { method: "DELETE" });
  }

  async function createAndStart() {
    const text = request.trim();
    if (!text) return;
    setBusy(true);
    setError(null);
    try {
      const created = await fetch(`/api/projects/${props.project.id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: text.slice(0, 120), request: text, priority: "medium", skillName: "research-journalist" }),
      });
      const body = await created.json();
      if (!created.ok) throw new Error(body?.error?.message ?? "Unable to create the research task");
      const started = await fetch(`/api/tasks/${body.data.id}/research`, { method: "POST" });
      const startedBody = await started.json().catch(() => ({}));
      if (!started.ok) throw new Error(startedBody?.error?.message ?? "Unable to start research");
      router.push(`/projects/${props.project.id}/chat?taskId=${body.data.id}`);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to start research");
    } finally {
      setBusy(false);
    }
  }

  async function decide(approvalId: string, decision: "accept" | "decline") {
    await perform(`/api/approvals/${approvalId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
  }

  return (
    <section className="chat-grid" aria-label="Project chat execution">
      <aside className="panel task-rail" aria-labelledby="task-selector">
        <div className="panel-title-row"><h2 id="task-selector">Tasks</h2></div>
        <div className="task-list">
          {props.tasks.map((task) => (
            <Link className={task.id === props.task?.id ? "task-item active" : "task-item"} href={`/projects/${props.project.id}/chat?taskId=${task.id}`} key={task.id}>
              <span><strong>{task.title}</strong><small>{task.codexThreadId ?? "Not connected"}</small></span>
              <StatusPill status={task.status === "researching" ? "running" : task.status} />
            </Link>
          ))}
          {!props.tasks.length ? <p className="empty-copy">Submit a brief to create the first task.</p> : null}
        </div>
      </aside>

      <section className="panel transcript-panel" aria-labelledby="transcript">
        <div className="panel-toolbar">
          <div><h2 id="transcript">Execution transcript</h2><p>{props.task ? `${props.events.length} recorded events` : "No research task yet"}</p></div>
          {props.task && activeRun ? (
            <button className="secondary-button" disabled={busy} onClick={cancel}><Square size={14} />Cancel</button>
          ) : props.task ? (
            <button className="primary-button" disabled={busy || !["backlog", "queued", "blocked", "failed", "cancelled"].includes(props.task.status)} onClick={start}><Play size={15} />{props.task.codexThreadId ? "Resume research" : "Start research"}</button>
          ) : null}
        </div>

        {error ? <div className="callout warning">{error}</div> : null}
        {props.approvals.map((approval) => (
          <div className="callout warning approval-callout" key={approval.id}>
            <div><strong>Approval required</strong><p>{approval.actionSummary}</p>{approval.reason ? <small>{approval.reason}</small> : null}</div>
            <div className="artifact-actions">
              <button className="compact-button" disabled={busy} onClick={() => decide(approval.id, "decline")}>Decline</button>
              <button className="primary-button" disabled={busy} onClick={() => decide(approval.id, "accept")}>Approve</button>
            </div>
          </div>
        ))}

        <div className="transcript">
          {props.messages.map((message) => <div className={`message ${message.role === "user" ? "operator" : "codex"}`} key={message.id}><span>{message.role === "user" ? "operator" : "codex"}</span><p>{message.content}</p></div>)}
          {props.events.slice(-8).map((event) => <div className="message event" key={`event-${event.id}`}><span>{event.type.replaceAll("_", " ")}</span><p>{event.message}</p></div>)}
          {!props.messages.length && !props.events.length ? <p className="empty-copy">Research activity will appear here.</p> : null}
        </div>

        <div className="composer">
          <div className="prompt-prefix">$research-journalist</div>
          <textarea aria-label="Research prompt" placeholder="Describe a new research task..." value={request} onChange={(event) => setRequest(event.target.value)} />
          <button className="icon-button send-button" disabled={busy || !request.trim()} onClick={createAndStart} aria-label="Create and start a new research task"><Send size={17} /></button>
        </div>
      </section>

      <aside className="side-stack">
        <section className="panel" aria-labelledby="status-panel">
          <div className="panel-title-row"><h2 id="status-panel">Research phases</h2><StatusPill status={props.task?.status ?? "queued"} /></div>
          <div className="phase-list">
            {phases.map((phase, index) => <div className="phase-row" key={phase}><span className="phase-check">{index + 1}</span><span>{phase.replaceAll("_", " ")}</span>{props.task?.currentPhase === phase ? <StatusPill status="running" label="Current" /> : null}</div>)}
          </div>
        </section>
        <section className="panel" aria-labelledby="source-panel">
          <div className="panel-title-row"><h2 id="source-panel">Sources</h2><FileText size={16} /></div>
          <div className="source-list">
            {props.sources.map((source) => <article className="source-item" key={source.id}><strong>{source.title}</strong><span>{source.publisher ?? source.author ?? "Source"}</span><small>{source.type} / {source.accessStatus}</small></article>)}
            {!props.sources.length ? <p className="empty-copy">No sources recorded yet.</p> : null}
          </div>
        </section>
        <section className="panel" aria-labelledby="retention-panel">
          <div className="panel-title-row"><h2 id="retention-panel">Retention audit</h2><ShieldCheck size={16} /></div>
          <div className="audit-stack">
            <div><span>Reports</span><strong>{props.reports.length}</strong></div>
            <div><span>Cleanup</span><strong>{props.cleanupAudit?.status ?? "pending"}</strong></div>
            <div><span>Deleted temporary files</span><strong>{props.cleanupAudit?.deletedItems.length ?? 0}</strong></div>
          </div>
        </section>
      </aside>
    </section>
  );
}
