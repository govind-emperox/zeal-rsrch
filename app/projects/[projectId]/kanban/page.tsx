import { Filter, Plus, Search, SlidersHorizontal } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ProjectTabs } from "@/components/project-tabs";
import { StatusPill } from "@/components/status-pill";
import { tasks } from "@/lib/mock-data";

const columns = [
  { key: "backlog", title: "Backlog" },
  { key: "researching", title: "Researching" },
  { key: "drafting", title: "Drafting" },
  { key: "review", title: "Review" },
  { key: "done", title: "Done" },
];

export default function KanbanPage() {
  return (
    <AppShell active="kanban">
      <div className="project-header">
        <div>
          <p className="eyebrow">Workflow board</p>
          <h1>Q3 AI procurement market map</h1>
          <p className="page-copy">Manual research workflow states for active Codex-backed tasks.</p>
        </div>
        <button className="primary-button">
          <Plus size={16} aria-hidden="true" />
          Add task
        </button>
      </div>

      <ProjectTabs active="kanban" />

      <section className="worker-strip" aria-label="Active worker context">
        <StatusPill status="running" label="Codex worker active" />
        <span>Thread rsrch_market_0918</span>
        <span>Current phase: writing</span>
        <span>Storage target: zeal-rsrch/projects/market-map-q3</span>
      </section>

      <section className="panel board-toolbar" aria-label="Board controls">
        <label className="inline-search">
          <Search size={15} aria-hidden="true" />
          <span className="sr-only">Search tasks</span>
          <input placeholder="Search tasks" />
        </label>
        <button className="secondary-button">
          <Filter size={15} aria-hidden="true" />
          Filter
        </button>
        <button className="secondary-button">
          <SlidersHorizontal size={15} aria-hidden="true" />
          Sort
        </button>
      </section>

      <section className="kanban-board" aria-label="Research workflow board">
        {columns.map((column) => {
          const columnTasks = tasks.filter((task) => task.status === column.key);
          return (
            <div className="kanban-column" key={column.key}>
              <div className="column-header">
                <h2>{column.title}</h2>
                <span>{columnTasks.length}</span>
              </div>
              <div className="kanban-stack">
                {columnTasks.map((task) => (
                  <article className="task-card" key={task.id}>
                    <div className="task-card-top">
                      <code>{task.id}</code>
                      <StatusPill status={task.priority} label={task.priority} />
                    </div>
                    <h3>{task.title}</h3>
                    <p>{task.latest}</p>
                    {task.blockedReason ? (
                      <div className="blocked-reason">{task.blockedReason}</div>
                    ) : null}
                    <div className="progress-track">
                      <span style={{ width: `${task.progress}%` }} />
                    </div>
                    <dl className="task-meta">
                      <div>
                        <dt>Updated</dt>
                        <dd>{task.updated}</dd>
                      </div>
                      <div>
                        <dt>Thread</dt>
                        <dd>{task.thread}</dd>
                      </div>
                      <div>
                        <dt>Report</dt>
                        <dd>{task.report}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </AppShell>
  );
}
