import "server-only";

import type { Project } from "@zeal-rsrch/contracts";
import { getRepositories } from "./database";

export type DashboardProject = {
  id: string;
  title: string;
  description: string;
  status: Project["status"];
  updated: string;
};

const updatedFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function toDashboardProject(project: Project): DashboardProject {
  return {
    id: project.id,
    title: project.title,
    description: project.description ?? "",
    status: project.status,
    updated: updatedFormatter.format(new Date(project.updatedAt)),
  };
}

export async function listDashboardProjects(): Promise<DashboardProject[]> {
  const projects = await getRepositories().projects.list({ limit: 100 });
  return projects.map(toDashboardProject);
}
