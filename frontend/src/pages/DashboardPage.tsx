import { AlertTriangle, CheckCircle2, CircleDashed, ListTodo, Loader } from "lucide-react";
import { CompletionChart, CompletionChartSkeleton } from "../components/dashboard/CompletionChart";
import { StatsCard, StatsCardSkeleton } from "../components/dashboard/StatsCard";
import { PageHeader } from "../components/layout/PageHeader";
import { TaskBoard } from "../components/tasks/TaskBoard";
import { Alert } from "../components/ui/Alert";
import { useAuth } from "../context/AuthContext";
import { useTaskStats } from "../hooks/useTasks";
import { greeting } from "../utils/date";
import { getErrorMessage } from "../utils/errors";

export function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isPending, isError, error } = useTaskStats();
  const firstName = user?.name.split(" ")[0] ?? "there";

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        description={
          stats && stats.dueToday > 0
            ? `Here's what's happening with your tasks. You have ${stats.dueToday} ${stats.dueToday === 1 ? "task" : "tasks"} due today.`
            : "Here's what's happening with your tasks."
        }
      />

      {isError && <Alert className="mb-6">Couldn't load your statistics. {getErrorMessage(error)}</Alert>}

      <section aria-label="Task statistics" className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {isPending || !stats ? (
            Array.from({ length: 5 }, (_, i) => <StatsCardSkeleton key={i} />)
          ) : (
            <>
              <StatsCard
                label="Total Tasks"
                value={stats.total}
                icon={ListTodo}
                hint="All tasks you've created"
                iconClassName="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                to="/tasks"
              />
              <StatsCard
                label="Pending"
                value={stats.todo}
                icon={CircleDashed}
                hint="Not started yet"
                iconClassName="bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                to="/tasks/pending?status=TODO"
              />
              <StatsCard
                label="In Progress"
                value={stats.inProgress}
                icon={Loader}
                hint="Currently being worked on"
                iconClassName="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                to="/tasks/pending?status=IN_PROGRESS"
              />
              <StatsCard
                label="Completed"
                value={stats.completed}
                icon={CheckCircle2}
                hint={`${stats.completionRate}% completion rate`}
                iconClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                to="/tasks/completed"
              />
              <StatsCard
                label="Overdue"
                value={stats.overdue}
                icon={AlertTriangle}
                hint={stats.overdue ? "Past their due date" : "Nothing overdue"}
                iconClassName="bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                to="/tasks?due=overdue"
                emphasis={stats.overdue > 0}
              />
              <div className="hidden rounded-xl border border-dashed border-zinc-200 p-4 sm:flex sm:flex-col sm:justify-center dark:border-zinc-800">
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Due today</p>
                <p className="mt-2 text-3xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">{stats.dueToday}</p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Open tasks due today</p>
              </div>
            </>
          )}
        </div>
        {isPending || !stats ? <CompletionChartSkeleton /> : <CompletionChart stats={stats} />}
      </section>

      <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">Your tasks</h2>
      <TaskBoard view="all" />
    </>
  );
}
