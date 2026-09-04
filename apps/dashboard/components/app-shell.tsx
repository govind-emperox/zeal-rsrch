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
import { projects } from "@/lib/mock-data";
import { StatusPill } from "@/components/status-pill";

const navItems = [
  { label: "Overview", href: "/", Icon: Home },
  { label: "Run Stream", href: "/", Icon: History },
  { label: "Projects", href: "/", Icon: FolderArchive },
  { label: "Reports Vault", href: "/projects/market-map-q3/files", Icon: FileText },
  { label: "Sources Manifest", href: "/projects/market-map-q3/files", Icon: Database },
  { label: "Audit Log", href: "/projects/market-map-q3/files", Icon: ListChecks },
];

type AppShellProps = {
  active: "dashboard" | "chat" | "kanban" | "files";
  children: React.ReactNode;
};

export function AppShell({ active, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/">
          <span className="brand-mark">R</span>
          <span>
            <strong>RSRCH Pilot</strong>
            <small>Local research ops</small>
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
            {projects.slice(0, 4).map((project) => (
              <Link
                className={project.id === "market-map-q3" ? "project-link active" : "project-link"}
                href="/projects/market-map-q3/chat"
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
