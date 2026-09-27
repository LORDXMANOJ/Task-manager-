import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import type { TaskPriority, TaskStatus } from "../../types";
import { cn } from "../../utils/cn";
import { PRIORITY_LABEL, STATUS_DOT, STATUS_LABEL } from "../../utils/task";

/** Status = coloured dot + text label (never colour alone). */
export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300">
      <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[status])} aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  );
}

const priorityStyles: Record<TaskPriority, { className: string; Icon: typeof ArrowUp }> = {
  HIGH: {
    className: "bg-red-50 text-red-700 ring-red-600/15 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-400/20",
    Icon: ArrowUp,
  },
  MEDIUM: {
    className: "bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20",
    Icon: Minus,
  },
  LOW: {
    className: "bg-sky-50 text-sky-700 ring-sky-600/15 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-400/20",
    Icon: ArrowDown,
  },
};

/** Priority = icon + label + tint, so it reads without colour. */
export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const { className, Icon } = priorityStyles[priority];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", className)}>
      <Icon className="h-3 w-3" aria-hidden />
      {PRIORITY_LABEL[priority]}
      <span className="sr-only"> priority</span>
    </span>
  );
}
