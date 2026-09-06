import Link from "next/link";
import {
  Archive,
  Bell,
  Database,
  FileText,
  FolderArchive,
  History,
  Home,
  ListChecks,
  Search,
  Settings2,
} from "lucide-react";
import { primaryProject, projects } from "@/lib/mock-data";
import { StatusPill } from "@/components/status-pill";

const navItems = [
  { label: "Overview", href: "/", Icon: Home },
  { label: "Project Activity", href: "/", Icon: History },
  { label: "Projects", href: "/", Icon: FolderArchive },
  {
    label: "Artifacts",
    href: `/projects/${primaryProject.id}/files`,
    Icon: FileText,
  },
  {
    label: "Research Sources",
    href: `/projects/${primaryProject.id}/files`,
    Icon: Database,
  },
  {
    label: "Editorial Workflow",
    href: `/projects/${primaryProject.id}/kanban`,
    Icon: ListChecks,
  },
];

type AppShellProps = {
  active: "dashboard" | "chat" | "kanban" | "files";
  children: React.ReactNode;
  projects?: Array<{ id: string; title: string; status: string }>;
  primaryProjectId?: string;
};

export function AppShell({
  active,
  children,
  projects: projectItems = projects,
  primaryProjectId = primaryProject.id,
}: AppShellProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/">
          <span className="brand-mark">R</span>
          <span>
            <strong>Cur8r Research</strong>
            <small>Podcast content workspace</small>
          </span>
        </Link>

        <nav className="sidebar-nav" aria-label="Global navigation">
          {navItems.map(({ label, href, Icon }) => (
            <Link
              className={
                (active === "dashboard" && label === "Overview") ||
                (active === "files" && label === "Reports Vault")
                  ? "nav-link active"
                  : "nav-link"
              }
              href={href}
              key={label}
            >
              <Icon size={16} aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>

        <section className="sidebar-section" aria-labelledby="sidebar-projects">
          <div className="sidebar-heading" id="sidebar-projects">
            Projects
          </div>
          <div className="project-list">
            {projectItems.slice(0, 4).map((project) => (
              <Link
                className={project.id === primaryProjectId ? "project-link active" : "project-link"}
                href={`/projects/${project.id}/chat`}
                key={project.id}
              >
                <span className="project-link-title">{project.title}</span>
                <StatusPill status={project.status} />
              </Link>
            ))}
          </div>
        </section>
      </aside>

      <div className="main-frame">
        <header className="topbar">
          <label className="global-search">
            <Search size={16} aria-hidden="true" />
            <span className="sr-only">Global search</span>
            <input placeholder="Search projects, reports, sources" />
          </label>
          <div className="topbar-actions">
            <button className="icon-button" aria-label="Notifications">
              <Bell size={17} />
            </button>
            <button className="icon-button" aria-label="Workspace settings">
              <Settings2 size={17} />
            </button>
            <button className="icon-button" aria-label="Archived projects">
              <Archive size={17} />
            </button>
          </div>
        </header>
        <main className="workspace">{children}</main>
      </div>
    </div>
  );
}
