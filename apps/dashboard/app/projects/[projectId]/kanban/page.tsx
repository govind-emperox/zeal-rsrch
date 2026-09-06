import { Plus, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ProjectTabs } from "@/components/project-tabs";
import { KanbanBoard } from "@/components/kanban-board";
import { getRepositories } from "@/lib/server/database";

export default async function KanbanPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const repositories = getRepositories();
  const [project, tasks] = await Promise.all([repositories.projects.get(projectId), repositories.tasks.listForProject(projectId)]);
  if (!project) return <AppShell active="kanban"><p>Project not found.</p></AppShell>;
  const cards = await Promise.all(tasks.map(async (task) => {
    const [events, reports] = await Promise.all([repositories.events.listForTask(task.id, { limit: 1 }), repositories.reports.listForTask(task.id)]);
    return { ...task, latestEvent: events[0]?.message ?? null, hasReport: reports.length > 0 };
  }));
  return (
    <AppShell active="kanban">
      <div className="project-header">
        <div>
          <p className="eyebrow">Workflow board</p>
          <h1>{project.title}</h1>
          <p className="page-copy">Research and editorial workflow for this project.</p>
        </div>
        <button className="primary-button">
          <Plus size={16} aria-hidden="true" />
          Add task
        </button>
      </div>

      <ProjectTabs active="kanban" projectId={projectId} />

      <section className="worker-strip" aria-label="Active worker context">
        <span>Project status: {project.status}</span>
        <span>{project.status === "archived" ? "Archived projects retain existing data and cannot receive new tasks." : "Task transitions are validated before they are saved."}</span>
      </section>

      <section className="panel board-toolbar" aria-label="Board controls">
        <label className="inline-search">
          <Search size={15} aria-hidden="true" />
          <span className="sr-only">Search tasks</span>
          <input placeholder="Search tasks" />
        </label>
      </section>
      <KanbanBoard tasks={cards} />
    </AppShell>
  );
}
