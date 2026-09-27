import { CheckCircle2, LayoutDashboard, ListTodo, LogOut, Plus, Settings } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTaskModal } from "../../context/TaskModalContext";
import { cn } from "../../utils/cn";
import { Logo } from "../ui/Logo";
import { ThemeToggle } from "../ui/ThemeToggle";

/** Top bar for phones. */
export function MobileHeader() {
  const { logout } = useAuth();
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-200/80 bg-white/85 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-md md:hidden dark:border-zinc-800 dark:bg-zinc-950/85">
      <Link to="/dashboard" aria-label="TaskFlow home">
        <Logo />
      </Link>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <button
          type="button"
          onClick={() => void logout()}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          aria-label="Log out"
        >
          <LogOut className="h-[18px] w-[18px]" />
        </button>
      </div>
    </header>
  );
}

const items = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard, end: false },
  { to: "/tasks", label: "Tasks", icon: ListTodo, end: false },
  null, // create button slot
  { to: "/tasks/completed", label: "Done", icon: CheckCircle2, end: false },
  { to: "/settings", label: "Settings", icon: Settings, end: false },
];

/** Bottom tab bar for phones, with a central create button. */
export function MobileNav() {
  const { openCreate } = useTaskModal();
  const { pathname } = useLocation();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200/80 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden dark:border-zinc-800 dark:bg-zinc-950/90"
      aria-label="Main navigation"
    >
      <ul className="grid h-16 grid-cols-5">
        {items.map((item, index) =>
          item ? (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === "/tasks" ? false : item.end}
                className={({ isActive }) => {
                  // "Tasks" shouldn't light up on /tasks/completed (that's "Done").
                  const active = isActive && !(item.to === "/tasks" && pathname === "/tasks/completed");
                  return cn(
                    "flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                    active ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-500 dark:text-zinc-400",
                  );
                }}
              >
                <item.icon className="h-5 w-5" aria-hidden />
                {item.label}
              </NavLink>
            </li>
          ) : (
            <li key={`create-${index}`} className="flex items-center justify-center">
              <button
                type="button"
                onClick={openCreate}
                className="flex h-12 w-12 -translate-y-2 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 transition-transform active:scale-95 dark:bg-indigo-500"
                aria-label="Create task"
              >
                <Plus className="h-6 w-6" />
              </button>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}
