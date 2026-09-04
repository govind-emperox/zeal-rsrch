import Link from "next/link";
import { Activity, CircleAlert, FileCheck2, FolderPlus, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import { environmentHealth, projects, telemetry } from "@/lib/mock-data";

export default function DashboardPage() {
  return (
    <AppShell active="dashboard">
      <div className="page-header">
        <div>
          <p className="eyebrow">Control plane</p>
          <h1>Research projects</h1>
          <p className="page-copy">
            Active local Codex-backed research work, source trails, reports, and cleanup state.
          </p>
        </div>
        <button className="primary-button">
          <FolderPlus size={16} aria-hidden="true" />
          New Project
        </button>
      </div>

      <section className="summary-grid" aria-label="Workspace summary">
        <article className="metric-card">
          <span>Active projects</span>
          <strong>4</strong>
          <small>1 queued, 1 blocked</small>
        </article>
        <article className="metric-card">
          <span>Running tasks</span>
          <strong>6</strong>
          <small>2 Codex threads live</small>
        </article>
        <article className="metric-card">
          <span>Blocked tasks</span>
          <strong>2</strong>
          <small>Operator action needed</small>
        </article>
        <article className="metric-card">
          <span>Completed reports</span>
          <strong>12</strong>
          <small>4 this week</small>
        </article>
      </section>

      <div className="dashboard-grid">
        <section className="panel project-panel" aria-labelledby="active-projects">
          <div className="panel-toolbar">
            <div>
              <h2 id="active-projects">Active projects</h2>
              <p>Open a project to continue chat execution, board work, or reports.</p>
            </div>
            <label className="inline-search">
              <Search size={15} aria-hidden="true" />
              <span className="sr-only">Filter projects</span>
              <input placeholder="Filter" />
            </label>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Tasks</th>
                  <th>Latest report</th>
                  <th aria-label="Open" />
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id}>
                    <td>
                      <strong>{project.title}</strong>
                      <small>{project.description}</small>
                    </td>
                    <td>
                      <StatusPill status={project.status} />
                    </td>
                    <td>{project.updated}</td>
                    <td>{project.tasks}</td>
                    <td>{project.report}</td>
                    <td>
                      <Link className="row-action" href="/projects/market-map-q3/chat">
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="side-stack">
          <section className="panel" aria-labelledby="telemetry-stream">
            <div className="panel-title-row">
              <h2 id="telemetry-stream">Run stream</h2>
              <StatusPill status="running" label="Live" />
            </div>
            <div className="event-list">
              {telemetry.map((event) => (
                <div className="event-row" key={`${event.time}-${event.event}`}>
                  <time>{event.time}</time>
                  <div>
                    <code>{event.event}</code>
                    <p>{event.message}</p>
                  </div>
                  <StatusPill status={event.status} />
                </div>
              ))}
            </div>
          </section>

          <section className="panel" aria-labelledby="local-env">
            <div className="panel-title-row">
              <h2 id="local-env">Local environment</h2>
              <Activity size={16} aria-hidden="true" />
            </div>
            <div className="health-list">
              {environmentHealth.map((item) => (
                <div className="health-row" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <StatusPill status={item.status} />
                </div>
              ))}
            </div>
            <div className="callout warning">
              <CircleAlert size={16} aria-hidden="true" />
              <span>One support eval task is waiting for source approval.</span>
            </div>
            <div className="callout success">
              <FileCheck2 size={16} aria-hidden="true" />
              <span>Latest cleanup audit passed for filing-review.</span>
            </div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
