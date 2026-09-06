import Link from "next/link";
import { Activity, CircleAlert, FileCheck2, FolderPlus, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import { channels, environmentHealth, projects, telemetry } from "@/lib/mock-data";

export default function DashboardPage() {
  return (
    <AppShell active="dashboard">
      <div className="page-header">
        <div>
          <p className="eyebrow">Cur8r research workspace</p>
          <h1>Content research projects</h1>
          <p className="page-copy">
            Research and editorial work for Cur8r&apos;s podcast channels.
          </p>
        </div>
        <button className="primary-button">
          <FolderPlus size={16} aria-hidden="true" />
          New Project
        </button>
      </div>

      <section className="summary-grid" aria-label="Workspace summary">
        <article className="metric-card">
          <span>Channels</span>
          <strong>3</strong>
          <small>1 publishing, 2 in production</small>
        </article>
        <article className="metric-card">
          <span>Active episodes</span>
          <strong>1</strong>
          <small>Sci-Fi Books Weekly · Episode 03</small>
        </article>
        <article className="metric-card">
          <span>Research candidates</span>
          <strong>34</strong>
          <small>September 1–30 releases</small>
        </article>
        <article className="metric-card">
          <span>Shortlisted titles</span>
          <strong>6</strong>
          <small>Work in progress</small>
        </article>
      </section>

      <div className="dashboard-grid">
        <section className="panel project-panel" aria-labelledby="active-projects">
          <div className="panel-toolbar">
            <div>
              <h2 id="active-projects">Active research project</h2>
              <p>Open the September episode to review its brief, workflow, and source files.</p>
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
                      <Link className="row-action" href={`/projects/${project.id}/chat`}>
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
              <h2 id="telemetry-stream">Project activity</h2>
              <StatusPill status="review" label="Reference data" />
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
              <span>Connect ChatGPT before starting the project&apos;s first in-app research run.</span>
            </div>
            <div className="callout success">
              <FileCheck2 size={16} aria-hidden="true" />
              <span>34 candidates and the six-title WIP shortlist are loaded as reference data.</span>
            </div>
          </section>

          <section className="panel" aria-labelledby="cur8r-channels">
            <div className="panel-title-row">
              <h2 id="cur8r-channels">Cur8r channels</h2>
              <StatusPill status="complete" label="3 channels" />
            </div>
            <div className="source-list">
              {channels.map((channel) => (
                <article className="source-item" key={channel.id}>
                  <strong>{channel.title}</strong>
                  <span>{channel.description}</span>
                  <small>
                    {channel.cadence} / {channel.statusLabel}
                  </small>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
