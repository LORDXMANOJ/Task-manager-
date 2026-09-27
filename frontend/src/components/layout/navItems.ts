import { CheckCircle2, CircleDashed, LayoutDashboard, ListTodo, Settings, type LucideIcon } from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tasks", label: "My Tasks", icon: ListTodo, end: true },
  { to: "/tasks/pending", label: "Pending", icon: CircleDashed },
  { to: "/tasks/completed", label: "Completed", icon: CheckCircle2 },
  { to: "/settings", label: "Settings", icon: Settings },
];
