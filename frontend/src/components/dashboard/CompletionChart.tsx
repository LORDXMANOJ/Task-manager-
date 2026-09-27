import type { TaskStats } from "../../types";
import { cn } from "../../utils/cn";
import { Skeleton } from "../ui/Skeleton";

/**
 * Lightweight, dependency-free analytics: a completion ring (headline number)
 * and one labelled bar per status. Every bar carries its value and percentage
 * as text, so colour is never the only way to tell them apart.
 */

function CompletionRing({ rate }: { rate: number }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - rate / 100);
  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="9" className="stroke-zinc-100 dark:stroke-zinc-800" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="stroke-status-done transition-[stroke-dashoffset] duration-700 ease-out"
          style={{ opacity: rate === 0 ? 0 : 1 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">{rate}%</span>
        <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">complete</span>
      </div>
    </div>
  );
}

function Bar({ label, value, total, colorClass }: { label: string; value: number; total: number; colorClass: string }) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div title={`${label}: ${value} ${value === 1 ? "task" : "tasks"} (${pct}%)`}>
      <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
        <span className="flex items-center gap-2 font-medium text-zinc-700 dark:text-zinc-300">
          <span className={cn("h-2 w-2 rounded-full", colorClass)} aria-hidden />
          {label}
        </span>
        <span className="tabular-nums text-zinc-500 dark:text-zinc-400">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{value}</span> · {pct}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className={cn("h-full rounded-full transition-[width] duration-700 ease-out", colorClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function CompletionChart({ stats }: { stats: TaskStats }) {
  const open = stats.todo + stats.inProgress;
  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Task completion</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {stats.total === 0 ? "Create a task to see your progress" : `${stats.completed} of ${stats.total} tasks done`}
        </p>
      </div>

      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        <CompletionRing rate={stats.completionRate} />
        <div className="w-full min-w-0 flex-1 space-y-3.5">
          <Bar label="Completed" value={stats.completed} total={stats.total} colorClass="bg-status-done" />
          <Bar label="In progress" value={stats.inProgress} total={stats.total} colorClass="bg-status-progress" />
          <Bar label="To do" value={stats.todo} total={stats.total} colorClass="bg-status-todo" />
        </div>
      </div>

      {open > 0 && (
        <div className="mt-5 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Open tasks by priority</p>
          <dl className="grid grid-cols-3 gap-2 text-center">
            {(
              [
                ["High", stats.byPriority.HIGH],
                ["Medium", stats.byPriority.MEDIUM],
                ["Low", stats.byPriority.LOW],
              ] as const
            ).map(([label, count]) => (
              <div key={label} className="rounded-lg bg-zinc-50 px-2 py-2 dark:bg-zinc-800/50">
                <dt className="text-xs text-zinc-500 dark:text-zinc-400">{label}</dt>
                <dd className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{count}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}

export function CompletionChartSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-2 h-3 w-40" />
      <div className="mt-5 flex items-center gap-6">
        <Skeleton className="h-28 w-28 rounded-full" />
        <div className="flex-1 space-y-4">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </div>
      </div>
    </div>
  );
}
