import Link from "next/link";
import { Files, LayoutDashboard, MessageSquareText } from "lucide-react";

const tabs = [
  {
    key: "chat",
    label: "Chat / Execution",
    Icon: MessageSquareText,
  },
  {
    key: "kanban",
    label: "Kanban Board",
    Icon: LayoutDashboard,
  },
  {
    key: "files",
    label: "Artifacts & Reports",
    Icon: Files,
  },
];

export function ProjectTabs({ active, projectId }: { active: string; projectId: string }) {
  return (
    <nav className="module-tabs" aria-label="Project modules">
      {tabs.map(({ key, label, Icon }) => (
        <Link
          className={active === key ? "module-tab active" : "module-tab"}
          href={`/projects/${projectId}/${key}`}
          key={key}
        >
          <Icon size={15} aria-hidden="true" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
