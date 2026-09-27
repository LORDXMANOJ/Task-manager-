import { LogOut, PanelLeftClose, PanelLeftOpen, Plus } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTaskModal } from "../../context/TaskModalContext";
import { cn } from "../../utils/cn";
import { Avatar } from "../ui/Avatar";
import { Logo } from "../ui/Logo";
import { ThemeToggle } from "../ui/ThemeToggle";
import { NAV_ITEMS } from "./navItems";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

/** Desktop sidebar; collapses to an icon rail (default on tablets). Hidden on phones. */
export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, logout } = useAuth();
  const { openCreate } = useTaskModal();

  const itemClass = (isActive: boolean) =>
    cn(
      "group flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
      collapsed && "justify-center px-0",
      isActive
        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/70 dark:hover:text-zinc-100",
    );

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-zinc-200/80 bg-white transition-[width] duration-200 md:flex dark:border-zinc-800 dark:bg-zinc-900",
        collapsed ? "w-[72px]" : "w-64",
      )}
      aria-label="Main navigation"
    >
      <div className={cn("flex h-16 items-center border-b border-zinc-100 dark:border-zinc-800", collapsed ? "justify-center px-2" : "justify-between px-5")}>
        <NavLink to="/dashboard" aria-label="TaskFlow home">
          <Logo collapsed={collapsed} />
        </NavLink>
        {!collapsed && (
          <button
            type="button"
            onClick={onToggle}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="h-[18px] w-[18px]" />
          </button>
        )}
      </div>

      <div className="px-3 pt-4">
        <button
          type="button"
          onClick={openCreate}
          className={cn(
            "flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 text-sm font-medium text-white shadow-sm shadow-indigo-600/20 transition-colors hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400",
          )}
          aria-label="Create task"
          title={collapsed ? "Create task" : undefined}
        >
          <Plus className="h-4 w-4" />
          {!collapsed && "Create Task"}
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => itemClass(isActive)} title={collapsed ? label : undefined}>
            <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
            {collapsed ? <span className="sr-only">{label}</span> : label}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-1 border-t border-zinc-100 p-3 dark:border-zinc-800">
        {collapsed && (
          <button
            type="button"
            onClick={onToggle}
            className={itemClass(false)}
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <PanelLeftOpen className="h-[18px] w-[18px]" />
          </button>
        )}
        <div className={cn("flex items-center", collapsed ? "flex-col gap-1" : "gap-1")}>
          <ThemeToggle />
          <button
            type="button"
            onClick={() => void logout()}
            className={cn(itemClass(false), collapsed ? "w-9" : "flex-1")}
            title="Log out"
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" aria-hidden />
            {collapsed ? <span className="sr-only">Log out</span> : "Logout"}
          </button>
        </div>
        {user && !collapsed && (
          <NavLink
            to="/settings"
            className="mt-2 flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/70"
          >
            <Avatar name={user.name} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{user.name}</p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{user.email}</p>
            </div>
          </NavLink>
        )}
      </div>
    </aside>
  );
}
