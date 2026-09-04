import { CheckCircle2, FileText, Play, Save, Send, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ProjectTabs } from "@/components/project-tabs";
import { StatusPill } from "@/components/status-pill";
import { sources, tasks, transcript } from "@/lib/mock-data";

const phases = [
  "queued",
  "planning",
  "searching",
  "scraping",
  "writing",
  "verifying",
  "cleanup",
  "complete",
];

export default function ProjectChatPage() {
  return (
    <AppShell active="chat">
      <div className="project-header">
        <div>
          <p className="eyebrow">Project</p>
          <h1>Q3 AI procurement market map</h1>
          <p className="page-copy">Codex worker active through $research-journalist.</p>
        </div>
        <div className="header-actions">
          <StatusPill status="running" label="Worker running" />
          <button className="secondary-button">
            <Save size={16} aria-hidden="true" />
            Save final report
          </button>
        </div>
      </div>

      <ProjectTabs active="chat" />

      <section className="chat-grid" aria-label="Project chat execution">
        <aside className="panel task-rail" aria-labelledby="task-selector">
          <div className="panel-title-row">
            <h2 id="task-selector">Tasks</h2>
            <button className="compact-button">New</button>
          </div>
          <div className="task-list">
            {tasks.slice(0, 5).map((task, index) => (
              <button className={index === 0 ? "task-item active" : "task-item"} key={task.id}>
                <span>
                  <strong>{task.title}</strong>
                  <small>{task.thread}</small>
                </span>
                <StatusPill status={task.status === "researching" ? "running" : task.status} />
              </button>
            ))}
          </div>
        </aside>

        <section className="panel transcript-panel" aria-labelledby="transcript">
          <div className="panel-toolbar">
            <div>
              <h2 id="transcript">Execution transcript</h2>
              <p>Thread rsrch_market_0918</p>
            </div>
            <button className="primary-button">
              <Play size={15} aria-hidden="true" />
              Start research
            </button>
          </div>

          <div className="transcript">
            {transcript.map((message, index) => (
              <div className={`message ${message.role}`} key={`${message.role}-${index}`}>
                <span>{message.role}</span>
                <p>{message.content}</p>
              </div>
            ))}
          </div>

          <div className="composer">
            <div className="prompt-prefix">$research-journalist</div>
            <textarea
              aria-label="Research prompt"
              placeholder="Ask Codex to continue this project..."
              defaultValue="Compare vendors by evidence strength, implementation risk, and source quality."
            />
            <button className="icon-button send-button" aria-label="Send prompt">
              <Send size={17} />
            </button>
          </div>
        </section>

        <aside className="side-stack">
          <section className="panel" aria-labelledby="status-panel">
            <div className="panel-title-row">
              <h2 id="status-panel">Codex phases</h2>
              <StatusPill status="running" label="Writing" />
            </div>
            <div className="phase-list">
              {phases.map((phase, index) => (
                <div className="phase-row" key={phase}>
                  <span className={index < 4 ? "phase-check done" : "phase-check"}>
                    {index < 4 ? <CheckCircle2 size={14} /> : index + 1}
                  </span>
                  <span>{phase}</span>
                  {phase === "writing" ? <StatusPill status="running" /> : null}
                </div>
              ))}
            </div>
          </section>

          <section className="panel" aria-labelledby="source-panel">
            <div className="panel-title-row">
              <h2 id="source-panel">Sources</h2>
              <FileText size={16} aria-hidden="true" />
            </div>
            <div className="source-list">
              {sources.map((source) => (
                <article className="source-item" key={source.title}>
                  <strong>{source.title}</strong>
                  <span>{source.publisher}</span>
                  <small>
                    {source.type} / {source.status}
                  </small>
                </article>
              ))}
            </div>
          </section>

          <section className="panel" aria-labelledby="retention-panel">
            <div className="panel-title-row">
              <h2 id="retention-panel">Retention audit</h2>
              <ShieldCheck size={16} aria-hidden="true" />
            </div>
            <div className="audit-stack">
              <div>
                <span>Retained</span>
                <strong>3 reports, 1 manifest</strong>
              </div>
              <div>
                <span>Temporary scrape</span>
                <strong>cleanup pending</strong>
              </div>
              <div>
                <span>Raw source bodies</span>
                <strong>not persisted</strong>
              </div>
            </div>
          </section>
        </aside>
      </section>
    </AppShell>
  );
}
