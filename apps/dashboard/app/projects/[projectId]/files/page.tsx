import { Download } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ProjectTabs } from "@/components/project-tabs";
import { ArtifactBrowser } from "@/components/artifact-browser";
import { getRepositories } from "@/lib/server/database";
import { listDashboardProjects } from "@/lib/server/projects";

export default async function FilesPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const repositories = getRepositories();
  const [project, artifacts, projects] = await Promise.all([repositories.projects.get(projectId), repositories.files.listForProject(projectId), listDashboardProjects()]);
  if (!project) return <AppShell active="files" projects={projects}><p>Project not found.</p></AppShell>;

  return (
    <AppShell active="files" projects={projects} primaryProjectId={projectId}>
      <div className="project-header">
        <div>
          <p className="eyebrow">Artifacts browser</p>
          <h1>{project.title}</h1>
          <p className="page-copy">Project artifacts retained by research runs and operators.</p>
        </div>
        <a className="secondary-button" href={`/api/projects/${projectId}/artifacts`}>
          <Download size={16} aria-hidden="true" />
          Export
        </a>
      </div>

      <ProjectTabs active="files" projectId={projectId} />

      <section className="summary-grid file-summary" aria-label="Artifact categories">
        <article className="metric-card">
          <span>Research files</span>
          <strong>{artifacts.length}</strong>
          <small>All visible artifacts</small>
        </article>
        <article className="metric-card">
          <span>Shortlist files</span>
          <strong>{artifacts.filter((artifact) => artifact.kind === "report").length}</strong>
          <small>Saved reports</small>
        </article>
        <article className="metric-card">
          <span>Research candidates</span>
          <strong>{artifacts.filter((artifact) => artifact.kind === "manifest").length}</strong>
          <small>Source manifests</small>
        </article>
        <article className="metric-card">
          <span>Shortlisted titles</span>
          <strong>{artifacts.filter((artifact) => artifact.kind === "audit").length}</strong>
          <small>Cleanup audits</small>
        </article>
      </section>

      <ArtifactBrowser artifacts={artifacts} />
    </AppShell>
  );
}
