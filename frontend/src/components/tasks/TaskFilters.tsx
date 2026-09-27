import { Loader2, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useDebounce } from "../../hooks/useDebounce";
import type { TaskFilters as Filters } from "../../hooks/useTaskFilters";
import { cn } from "../../utils/cn";
import { DUE_OPTIONS, PRIORITY_OPTIONS, SORT_OPTIONS } from "../../utils/task";

interface TaskFiltersProps {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  statusOptions: { value: string; label: string }[] | null; // null hides the status filter
  isFetching?: boolean;
}

const selectClass =
  "h-10 w-full min-w-0 cursor-pointer rounded-lg border border-zinc-200 bg-white pl-3 pr-8 text-sm text-zinc-700 shadow-xs transition-colors hover:border-zinc-300 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-600";

function FilterSelect({
  label,
  value,
  options,
  onChange,
  active,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  active: boolean;
}) {
  return (
    <label className="block min-w-0">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(selectClass, active && "border-indigo-300 bg-indigo-50/60 text-indigo-800 dark:border-indigo-500/40 dark:bg-indigo-500/10 dark:text-indigo-200")}
        aria-label={label}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function TaskFilters({ filters, onChange, onReset, hasActiveFilters, statusOptions, isFetching }: TaskFiltersProps) {
  // Local input state keeps typing responsive; the URL/API update is debounced.
  const [search, setSearch] = useState(filters.search);
  const debounced = useDebounce(search, 300);

  useEffect(() => {
    if (debounced !== filters.search) onChange({ search: debounced });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  // Sync when filters are cleared externally.
  useEffect(() => {
    setSearch(filters.search);
  }, [filters.search]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks by title or description..."
            aria-label="Search tasks"
            maxLength={100}
            className="h-10 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-9 text-sm text-zinc-900 shadow-xs placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 [&::-webkit-search-cancel-button]:hidden"
          />
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center">
            {isFetching && search ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin text-zinc-400" aria-label="Searching" />
            ) : search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="rounded p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>

        <div className={cn("grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex lg:shrink-0", !statusOptions && "sm:grid-cols-3")}>
          {statusOptions && (
            <div className="lg:w-36">
              <FilterSelect
                label="Filter by status"
                value={filters.status}
                options={statusOptions}
                onChange={(v) => onChange({ status: v as Filters["status"] })}
                active={filters.status !== "ALL"}
              />
            </div>
          )}
          <div className="lg:w-36">
            <FilterSelect
              label="Filter by priority"
              value={filters.priority}
              options={[{ value: "ALL", label: "All priorities" }, ...PRIORITY_OPTIONS]}
              onChange={(v) => onChange({ priority: v as Filters["priority"] })}
              active={filters.priority !== "ALL"}
            />
          </div>
          <div className="lg:w-36">
            <FilterSelect
              label="Filter by due date"
              value={filters.due}
              options={DUE_OPTIONS}
              onChange={(v) => onChange({ due: v as Filters["due"] })}
              active={filters.due !== "all"}
            />
          </div>
          <div className={cn("lg:w-44", !statusOptions && "col-span-2 sm:col-span-1")}>
            <FilterSelect
              label="Sort tasks"
              value={filters.sort}
              options={SORT_OPTIONS.map((o) => ({ ...o, label: `Sort: ${o.label}` }))}
              onChange={(v) => onChange({ sort: v as Filters["sort"] })}
              active={false}
            />
          </div>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex animate-fade-in items-center gap-2 text-sm">
          <span className="text-zinc-500 dark:text-zinc-400">Filters applied</span>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              onReset();
            }}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
