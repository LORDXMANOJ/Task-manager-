import { CalendarDays, Check, Pencil, PlayCircle, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTaskModal } from "../../context/TaskModalContext";
import { useDeleteTask, useUpdateTaskStatus } from "../../hooks/useTasks";
import type { Task } from "../../types";
import { cn } from "../../utils/cn";
import { formatDate, formatRelativeTime, relativeDueLabel } from "../../utils/date";
import { isOverdue } from "../../utils/task";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { PriorityBadge, StatusBadge } from "./TaskBadges";

const actionClass =
  "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors disabled:opacity-50";

export function TaskCard({ task }: { task: Task }) {
  const { openEdit } = useTaskModal();
  const updateStatus = useUpdateTaskStatus();
  const deleteTask = useDeleteTask();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const completed = task.status === "COMPLETED";
  const overdue = isOverdue(task);
  const busy = updateStatus.isPending || deleteTask.isPending;

  const toggleComplete = () =>
    updateStatus.mutate({ id: task.id, status: completed ? "TODO" : "COMPLETED" });

  return (
    <article
      className={cn(
        "group relative flex gap-3 rounded-xl border bg-white p-4 shadow-xs transition-all duration-150 hover:shadow-md sm:p-5 dark:bg-zinc-900",
        overdue
          ? "border-red-200 dark:border-red-500/30"
          : "border-zinc-200/80 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700",
        completed && "bg-zinc-50/70 dark:bg-zinc-900/50",
        deleteTask.isPending && "pointer-events-none opacity-50",
      )}
      aria-busy={busy || undefined}
    >
      {overdue && <span className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-red-500" aria-hidden />}

      {/* Completion checkbox */}
      <button
        type="button"
        role="checkbox"
        aria-checked={completed}
        aria-label={completed ? `Mark "${task.title}" as not completed` : `Mark "${task.title}" as completed`}
        onClick={toggleComplete}
        disabled={busy}
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-150",
          completed
            ? "border-status-done bg-status-done text-white"
            : "border-zinc-300 text-transparent hover:border-emerald-500 hover:text-emerald-500 dark:border-zinc-600",
        )}
      >
        <Check className="h-3 w-3" strokeWidth={3} />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <h3
            className={cn(
              "min-w-0 break-words text-[15px] font-semibold leading-snug",
              completed ? "text-zinc-400 line-through decoration-zinc-300 dark:text-zinc-500 dark:decoration-zinc-600" : "text-zinc-900 dark:text-zinc-50",
            )}
          >
            {task.title}
          </h3>
          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
            <PriorityBadge priority={task.priority} />
            <StatusBadge status={task.status} />
          </div>
        </div>

        {task.description && (
          <p
            className={cn(
              "mt-1.5 line-clamp-2 break-words text-sm whitespace-pre-line",
              completed ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-600 dark:text-zinc-400",
            )}
          >
            {task.description}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
            {task.dueDate ? (
              <span
                className={cn("inline-flex items-center gap-1", overdue && "font-semibold text-red-600 dark:text-red-400")}
                title={formatDate(task.dueDate)}
              >
                <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                {completed ? `Due ${formatDate(task.dueDate)}` : relativeDueLabel(task.dueDate)}
                {overdue && <span className="sr-only"> (overdue)</span>}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-zinc-400 dark:text-zinc-500">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                No due date
              </span>
            )}
            <span className="hidden text-zinc-400 sm:inline dark:text-zinc-500">
              Updated {formatRelativeTime(task.updatedAt)}
            </span>
          </div>

          <div className="-mr-1.5 flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => openEdit(task)}
              disabled={busy}
              className={cn(actionClass, "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100")}
              aria-label={`Edit "${task.title}"`}
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
              <span>Edit</span>
            </button>
            {task.status === "TODO" && (
              <button
                type="button"
                onClick={() => updateStatus.mutate({ id: task.id, status: "IN_PROGRESS" })}
                disabled={busy}
                className={cn(actionClass, "hidden text-zinc-600 hover:bg-amber-50 hover:text-amber-700 sm:inline-flex dark:text-zinc-400 dark:hover:bg-amber-500/10 dark:hover:text-amber-300")}
                aria-label={`Start "${task.title}"`}
              >
                <PlayCircle className="h-3.5 w-3.5" aria-hidden />
                <span>Start</span>
              </button>
            )}
            <button
              type="button"
              onClick={toggleComplete}
              disabled={busy}
              className={cn(actionClass, "text-zinc-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-zinc-400 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300")}
            >
              {completed ? <RotateCcw className="h-3.5 w-3.5" aria-hidden /> : <Check className="h-3.5 w-3.5" aria-hidden />}
              <span>{completed ? "Reopen" : "Complete"}</span>
            </button>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={busy}
              className={cn(actionClass, "text-zinc-600 hover:bg-red-50 hover:text-red-700 dark:text-zinc-400 dark:hover:bg-red-500/10 dark:hover:text-red-300")}
              aria-label={`Delete "${task.title}"`}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete task?"
        message={`"${task.title}" will be permanently deleted. This can't be undone.`}
        confirmLabel="Delete task"
        loading={deleteTask.isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => deleteTask.mutate(task.id, { onSettled: () => setConfirmOpen(false) })}
      />
    </article>
  );
}

export function TaskCardSkeleton() {
  return (
    <div className="flex gap-3 rounded-xl border border-zinc-200/80 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900" aria-hidden>
      <div className="mt-0.5 h-5 w-5 shrink-0 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
      <div className="flex-1 space-y-3">
        <div className="flex justify-between gap-4">
          <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="hidden gap-1.5 sm:flex">
            <div className="h-5 w-16 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-5 w-20 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </div>
        <div className="h-3 w-4/5 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800/70" />
        <div className="flex justify-between">
          <div className="h-3 w-24 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800/70" />
          <div className="h-6 w-40 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800/70" />
        </div>
      </div>
    </div>
  );
}
