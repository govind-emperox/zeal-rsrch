import Link from "next/link";
import { Files, LayoutDashboard, MessageSquareText } from "lucide-react";

const tabs = [
  {
    key: "chat",
    label: "Chat / Execution",
    href: "/projects/market-map-q3/chat",
    Icon: MessageSquareText,
  },
  {
    key: "kanban",
    label: "Kanban Board",
    href: "/projects/market-map-q3/kanban",
    Icon: LayoutDashboard,
  },
  {
    key: "files",
    label: "Artifacts & Reports",
    href: "/projects/market-map-q3/files",
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
