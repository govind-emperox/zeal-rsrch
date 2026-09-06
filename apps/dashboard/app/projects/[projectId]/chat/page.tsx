import { FileText, Play, Save, Send, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ProjectTabs } from "@/components/project-tabs";
import { StatusPill } from "@/components/status-pill";
import { primaryProject, sources, tasks, transcript } from "@/lib/mock-data";

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
          <h1>{primaryProject.title}</h1>
          <p className="page-copy">
            {primaryProject.channel} · {primaryProject.episode} research workspace.
          </p>
        </div>
        <div className="header-actions">
          <StatusPill status="queued" label="Connection not started" />
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
              <p>ChatGPT research run not started</p>
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
            <div className="prompt-prefix">ChatGPT research brief</div>
            <textarea
              aria-label="Research prompt"
              placeholder="Ask ChatGPT to research this project..."
              defaultValue="Research new and upcoming adult science-fiction books releasing in September 2026. Compare the results with the existing Cur8r research and WIP shortlist."
            />
            <button className="icon-button send-button" aria-label="Send prompt">
              <Send size={17} />
            </button>
          </div>
        </section>

        <aside className="side-stack">
          <section className="panel" aria-labelledby="status-panel">
            <div className="panel-title-row">
              <h2 id="status-panel">Research phases</h2>
              <StatusPill status="queued" label="Queued" />
            </div>
            <div className="phase-list">
              {phases.map((phase, index) => (
                <div className="phase-row" key={phase}>
                  <span className="phase-check">{index + 1}</span>
                  <span>{phase}</span>
                  {phase === "queued" ? <StatusPill status="queued" /> : null}
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
                <strong>2 research files, 1 shortlist</strong>
              </div>
              <div>
                <span>Working artifact</span>
                <strong>shortlist needs review</strong>
              </div>
              <div>
                <span>Research run</span>
                <strong>not started</strong>
              </div>
            </div>
          </section>
        </aside>
      </section>
    </AppShell>
  );
}
