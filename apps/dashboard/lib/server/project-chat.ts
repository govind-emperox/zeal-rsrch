import "server-only";

import { getRepositories } from "./database";

export async function getProjectChat(projectId: string) {
  const repositories = getRepositories();
  const project = await repositories.projects.get(projectId);
  if (!project) return null;
  const tasks = await repositories.tasks.listForProject(projectId);
  const selectedTask = tasks[0] ?? null;
  if (!selectedTask) return { project, tasks, task: null, messages: [], events: [], runs: [], approvals: [], reports: [] };
  const [messages, events, runs, approvals, reports] = await Promise.all([
    repositories.messages.listForTask(selectedTask.id),
    repositories.events.listForTask(selectedTask.id),
    repositories.runs.listForTask(selectedTask.id),
    repositories.approvals.listPendingForTask(selectedTask.id),
    repositories.reports.listForTask(selectedTask.id),
  ]);
  return { project, tasks, task: selectedTask, messages, events, runs, approvals, reports };
}
