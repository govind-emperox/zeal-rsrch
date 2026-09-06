import Link from "next/link";
import { Files, LayoutDashboard, MessageSquareText } from "lucide-react";
import { primaryProject } from "@/lib/mock-data";

const tabs = [
  {
    key: "chat",
    label: "Chat / Execution",
    href: `/projects/${primaryProject.id}/chat`,
    Icon: MessageSquareText,
  },
  {
    key: "kanban",
    label: "Kanban Board",
    href: `/projects/${primaryProject.id}/kanban`,
    Icon: LayoutDashboard,
  },
  {
    key: "files",
    label: "Artifacts & Reports",
    href: `/projects/${primaryProject.id}/files`,
    Icon: Files,
  },
];

export function ProjectTabs({ active }: { active: string }) {
  return (
    <nav className="module-tabs" aria-label="Project modules">
      {tabs.map(({ key, label, href, Icon }) => (
        <Link
          className={active === key ? "module-tab active" : "module-tab"}
          href={href}
          key={key}
        >
          <Icon size={15} aria-hidden="true" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
