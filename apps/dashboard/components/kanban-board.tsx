"use client";

import { startTransition, useOptimistic, useState } from "react";
import type { Task } from "@zeal-rsrch/contracts";
import { StatusPill } from "./status-pill";

const columns: Array<{ key: Task["status"]; title: string }> = [
  { key: "backlog", title: "Backlog" },
  { key: "queued", title: "Queued" },
  { key: "researching", title: "Researching" },
  { key: "drafting", title: "Drafting" },
  { key: "review", title: "Review" },
  { key: "done", title: "Done" },
  { key: "blocked", title: "Blocked" },
];

type Card = Task & { latestEvent: string | null; hasReport: boolean };

export function KanbanBoard({ tasks }: { tasks: Card[] }) {
  const [error, setError] = useState<string | null>(null);
  const [optimisticTasks, move] = useOptimistic(tasks, (current, task: Card) => current.map((item) => item.id === task.id ? task : item));

  async function moveTask(task: Card, status: Task["status"]) {
    if (status === task.status) return;
    const blockedReason = status === "blocked" ? window.prompt("Why is this task blocked?")?.trim() : undefined;
    if (status === "blocked" && !blockedReason) return;
    const pending = { ...task, status, blockedReason: status === "blocked" ? blockedReason ?? null : null, version: task.version + 1 };
    setError(null);
    startTransition(async () => {
      move(pending);
      const response = await fetch(`/api/tasks/${task.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, blockedReason, version: task.version }) });
      if (!response.ok) {
        setError((await response.json().catch(() => null))?.error?.message ?? "Unable to move task");
        return;
      }
      move({ ...pending, ...(await response.json()).data });
    });
  }

  return <>
    {error ? <p className="callout warning" role="alert">{error}</p> : null}
    <section className="kanban-board" aria-label="Research workflow board">
      {columns.map((column) => {
        const columnTasks = optimisticTasks.filter((task) => task.status === column.key);
        return <div className="kanban-column" key={column.key}>
          <div className="column-header"><h2>{column.title}</h2><span>{columnTasks.length}</span></div>
          <div className="kanban-stack">
            {columnTasks.map((task) => <article className="task-card" key={task.id}>
              <div className="task-card-top"><code>{task.id.slice(0, 8)}</code><StatusPill status={task.priority} label={task.priority} /></div>
              <h3>{task.title}</h3>
              {task.blockedReason ? <div className="blocked-reason">{task.blockedReason}</div> : null}
              <dl className="task-meta"><div><dt>Phase</dt><dd>{task.currentPhase ?? "Not started"}</dd></div><div><dt>Report</dt><dd>{task.hasReport ? "Available" : "Not ready"}</dd></div><div><dt>Chat</dt><dd>{task.codexThreadId ? "Linked" : "Not started"}</dd></div><div><dt>Latest event</dt><dd>{task.latestEvent ?? "No activity yet"}</dd></div></dl>
              <label className="task-transition"><span>Move to</span><select value={task.status} onChange={(event) => moveTask(task, event.target.value as Task["status"])} aria-label={`Move ${task.title}`}><option value={task.status}>{task.status}</option>{columns.filter((item) => item.key !== task.status).map((item) => <option value={item.key} key={item.key}>{item.title}</option>)}</select></label>
            </article>)}
          </div>
        </div>;
      })}
    </section>
  </>;
}
