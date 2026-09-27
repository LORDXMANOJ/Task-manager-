import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, ClipboardList, PartyPopper, Plus, SearchX } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useTaskModal } from "../../context/TaskModalContext";
import { useTaskFilters } from "../../hooks/useTaskFilters";
import { useTaskList } from "../../hooks/useTasks";
import type { TaskQuery, TaskStatus } from "../../types";
import { getErrorMessage } from "../../utils/errors";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { TaskCard, TaskCardSkeleton } from "./TaskCard";
import { TaskFilters } from "./TaskFilters";

export type TaskView = "all" | "pending" | "completed";

const PAGE_SIZE = 20;

const VIEW_CONFIG: Record<
  TaskView,
  { baseStatus?: TaskStatus[]; statusOptions: { value: string; label: string }[] | null }
> = {
  all: {
    statusOptions: [
      { value: "ALL", label: "All statuses" },
      { value: "TODO", label: "To do" },
      { value: "IN_PROGRESS", label: "In progress" },
      { value: "COMPLETED", label: "Completed" },
    ],
  },
  pending: {
    baseStatus: ["TODO", "IN_PROGRESS"],
    statusOptions: [
      { value: "ALL", label: "All pending" },
      { value: "TODO", label: "To do" },
      { value: "IN_PROGRESS", label: "In progress" },
    ],
  },
  completed: { baseStatus: ["COMPLETED"], statusOptions: null },
};

/** Search + filters + sorted, paginated task list. Used by the dashboard and task pages. */
export function TaskBoard({ view = "all" }: { view?: TaskView }) {
  const { openCreate } = useTaskModal();
  const { filters, setFilters, resetFilters, hasActiveFilters } = useTaskFilters();
  const config = VIEW_CONFIG[view];

  const query = useMemo<TaskQuery>(() => {
    const allowed = config.statusOptions?.some((o) => o.value === filters.status);
    const status = filters.status !== "ALL" && allowed ? [filters.status as TaskStatus] : config.baseStatus;
    return {
      search: filters.search.trim() || undefined,
      status,
      priority: filters.priority !== "ALL" ? [filters.priority] : undefined,
      due: filters.due,
      sort: filters.sort,
      page: filters.page,
      limit: PAGE_SIZE,
    };
  }, [filters, config]);

  const { data, isPending, isError, error, refetch, isFetching, isPlaceholderData } = useTaskList(query);

  // If deleting the last task on a page leaves it empty, step back a page.
  useEffect(() => {
    if (data && data.tasks.length === 0 && filters.page > 1 && data.pagination.total > 0) {
      setFilters({ page: data.pagination.totalPages });
    }
  }, [data, filters.page, setFilters]);

  const tasks = data?.tasks ?? [];
  const pagination = data?.pagination;

  const renderEmpty = () => {
    const onlyOverdue = filters.due === "overdue" && !filters.search && filters.priority === "ALL" && filters.status === "ALL";
    if (onlyOverdue) {
      return (
        <EmptyState
          icon={PartyPopper}
          tone="success"
          title="No overdue tasks"
          description="You're all caught up. Nothing is past its due date."
        />
      );
    }
    if (hasActiveFilters) {
      return (
        <EmptyState
          icon={SearchX}
          title="No matching tasks"
          description={
            filters.search
              ? `Nothing matches "${filters.search}" with the current filters. Try a different search or clear the filters.`
              : "No tasks match these filters. Try adjusting or clearing them."
          }
          action={
            <Button variant="outline" onClick={resetFilters}>
              Clear filters
            </Button>
          }
        />
      );
    }
    if (view === "completed") {
      return (
        <EmptyState
          icon={CheckCircle2}
          tone="success"
          title="No completed tasks yet"
          description="Tasks you finish will show up here. Tick one off to get started."
        />
      );
    }
    if (view === "pending") {
      return (
        <EmptyState
          icon={PartyPopper}
          tone="success"
          title="Nothing pending"
          description="Every task is done. Enjoy the moment, or plan what's next."
          action={
            <Button onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>
              Create task
            </Button>
          }
        />
      );
    }
    return (
      <EmptyState
        icon={ClipboardList}
        title="No tasks yet"
        description="Create your first task and start getting things done."
        action={
          <Button onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>
            Create task
          </Button>
        }
      />
    );
  };

  return (
    <section className="space-y-4" aria-label="Tasks">
      <TaskFilters
        filters={filters}
        onChange={setFilters}
        onReset={resetFilters}
        hasActiveFilters={hasActiveFilters}
        statusOptions={config.statusOptions}
        isFetching={isFetching}
      />

      {pagination && tasks.length > 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400" aria-live="polite">
          {pagination.total} {pagination.total === 1 ? "task" : "tasks"}
          {isFetching && !isPending && <span className="ml-2 text-zinc-400">Updating...</span>}
        </p>
      )}

      {isPending ? (
        <div className="space-y-3" aria-busy="true" aria-label="Loading tasks">
          <span className="sr-only">Loading tasks...</span>
          {Array.from({ length: 4 }, (_, i) => (
            <TaskCardSkeleton key={i} />
          ))}
        </div>
      ) : isError && !data ? (
        <EmptyState
          icon={AlertTriangle}
          tone="error"
          title="Couldn't load your tasks"
          description={getErrorMessage(error)}
          action={
            <Button variant="outline" onClick={() => refetch()} loading={isFetching}>
              Try again
            </Button>
          }
        />
      ) : tasks.length === 0 ? (
        renderEmpty()
      ) : (
        <ul className={isPlaceholderData ? "space-y-3 opacity-60 transition-opacity" : "space-y-3 transition-opacity"}>
          {tasks.map((task) => (
            <li key={task.id} className="animate-fade-in">
              <TaskCard task={task} />
            </li>
          ))}
        </ul>
      )}

      {pagination && pagination.totalPages > 1 && tasks.length > 0 && (
        <nav className="flex items-center justify-between gap-3 pt-2" aria-label="Pagination">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page <= 1 || isFetching}
            onClick={() => setFilters({ page: pagination.page - 1 })}
            leftIcon={<ChevronLeft className="h-4 w-4" />}
          >
            Previous
          </Button>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page >= pagination.totalPages || isFetching}
            onClick={() => setFilters({ page: pagination.page + 1 })}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </nav>
      )}
    </section>
  );
}
