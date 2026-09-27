import { NavLink } from "react-router-dom";
import { PageHeader } from "../components/layout/PageHeader";
import { TaskBoard, type TaskView } from "../components/tasks/TaskBoard";
import { cn } from "../utils/cn";

const COPY: Record<TaskView, { title: string; description: string }> = {
  all: { title: "My Tasks", description: "Everything on your list, in one place." },
  pending: { title: "Pending", description: "Tasks that still need your attention." },
  completed: { title: "Completed", description: "Everything you've finished. Nice work." },
};

const TABS: { to: string; label: string; end?: boolean }[] = [
  { to: "/tasks", label: "All", end: true },
  { to: "/tasks/pending", label: "Pending" },
  { to: "/tasks/completed", label: "Completed" },
];

export function TasksPage({ view }: { view: TaskView }) {
  return (
    <>
      <PageHeader title={COPY[view].title} description={COPY[view].description} />

      <nav className="mb-5 inline-flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900" aria-label="Task views">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                "rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      {/* key resets filter-dependent UI state when switching views */}
      <TaskBoard key={view} view={view} />
    </>
  );
}
