import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { DueFilter, SortOption, TaskPriority, TaskStatus } from "../types";

export interface TaskFilters {
  search: string;
  status: TaskStatus | "ALL";
  priority: TaskPriority | "ALL";
  due: DueFilter;
  sort: SortOption;
  page: number;
}

const DEFAULTS: TaskFilters = { search: "", status: "ALL", priority: "ALL", due: "all", sort: "newest", page: 1 };

const STATUSES = ["TODO", "IN_PROGRESS", "COMPLETED"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH"];
const DUES = ["all", "today", "week", "overdue", "none"];
const SORTS = ["newest", "oldest", "dueDate", "priority", "updated"];

const pick = <T extends string>(value: string | null, allowed: string[], fallback: T): T =>
  value && allowed.includes(value) ? (value as T) : fallback;

/**
 * Filters live in the URL (?q=&status=&priority=&due=&sort=&page=) so they
 * survive refreshes, can be shared, and work with the back button.
 */
export function useTaskFilters() {
  const [params, setParams] = useSearchParams();

  const filters = useMemo<TaskFilters>(
    () => ({
      search: params.get("q") ?? "",
      status: pick(params.get("status"), STATUSES, "ALL"),
      priority: pick(params.get("priority"), PRIORITIES, "ALL"),
      due: pick(params.get("due"), DUES, "all"),
      sort: pick(params.get("sort"), SORTS, "newest"),
      page: Math.max(1, Number(params.get("page")) || 1),
    }),
    [params],
  );

  const setFilters = useCallback(
    (patch: Partial<TaskFilters>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const merged = { ...filters, ...patch };
          // Any change other than paging returns to page 1.
          if (!("page" in patch)) merged.page = 1;

          const entries: Record<string, string | number> = {
            q: merged.search,
            status: merged.status,
            priority: merged.priority,
            due: merged.due,
            sort: merged.sort,
            page: merged.page,
          };
          const defaults: Record<string, string | number> = {
            q: DEFAULTS.search,
            status: DEFAULTS.status,
            priority: DEFAULTS.priority,
            due: DEFAULTS.due,
            sort: DEFAULTS.sort,
            page: DEFAULTS.page,
          };
          for (const [key, value] of Object.entries(entries)) {
            if (value === defaults[key] || value === "") next.delete(key);
            else next.set(key, String(value));
          }
          return next;
        },
        { replace: true },
      );
    },
    [filters, setParams],
  );

  const resetFilters = useCallback(() => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      ["q", "status", "priority", "due", "page"].forEach((key) => next.delete(key));
      return next;
    });
  }, [setParams]);

  const hasActiveFilters =
    filters.search.trim() !== "" || filters.status !== "ALL" || filters.priority !== "ALL" || filters.due !== "all";

  return { filters, setFilters, resetFilters, hasActiveFilters };
}
