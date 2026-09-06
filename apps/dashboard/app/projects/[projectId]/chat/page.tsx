import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ProjectTabs } from "@/components/project-tabs";
import { ResearchChat } from "@/components/research-chat";
import { getProjectChat } from "@/lib/server/project-chat";
import { listDashboardProjects } from "@/lib/server/projects";

export const dynamic = "force-dynamic";

export default async function ProjectChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ taskId?: string }>;
}) {
  const { projectId } = await params;
  const data = await getProjectChat(projectId, (await searchParams).taskId);
  if (!data) notFound();
  const projects = await listDashboardProjects();

  return (
    <AppShell active="chat" projects={projects} primaryProjectId={projectId}>
      <div className="project-header">
        <div>
          <p className="eyebrow">Project</p>
          <h1>{data.project.title}</h1>
          <p className="page-copy">{data.project.description ?? "Codex-backed research workspace"}</p>
        </div>
      </div>
      <ProjectTabs active="chat" projectId={data.project.id} />
      <ResearchChat {...data} />
    </AppShell>
  );
}
