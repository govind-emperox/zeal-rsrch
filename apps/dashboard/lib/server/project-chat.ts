import "server-only";

import { getRepositories } from "./database";

export async function getProjectChat(projectId: string, selectedTaskId?: string) {
  const repositories = getRepositories();
  const project = await repositories.projects.get(projectId);
  if (!project) return null;
  const tasks = await repositories.tasks.listForProject(projectId);
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? tasks[0] ?? null;
  if (!selectedTask) return { project, tasks, task: null, messages: [], events: [], runs: [], approvals: [], reports: [], sources: [], cleanupAudit: null };
  const [messages, events, runs, approvals, reports, sources] = await Promise.all([
    repositories.messages.listForTask(selectedTask.id),
    repositories.events.listForTask(selectedTask.id),
    repositories.runs.listForTask(selectedTask.id),
    repositories.approvals.listPendingForTask(selectedTask.id),
    repositories.reports.listForTask(selectedTask.id),
    repositories.sources.listForTask(selectedTask.id),
  ]);
  const cleanupAudit = runs[0] ? await repositories.cleanupAudits.getForRun(runs[0].id) : null;
  return { project, tasks, task: selectedTask, messages, events, runs, approvals, reports, sources, cleanupAudit };
}
