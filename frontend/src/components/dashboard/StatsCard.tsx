import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "../../utils/cn";
import { Skeleton } from "../ui/Skeleton";

interface StatsCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  hint?: string;
  iconClassName: string;
  to?: string;
  emphasis?: boolean;
}

export function StatsCard({ label, value, icon: Icon, hint, iconClassName, to, emphasis }: StatsCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", iconClassName)}>
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </div>
      <p
        className={cn(
          "mt-2 text-3xl font-semibold tabular-nums tracking-tight",
          emphasis ? "text-red-600 dark:text-red-400" : "text-zinc-900 dark:text-zinc-50",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>}
    </>
  );

  const className =
    "block rounded-xl border border-zinc-200/80 bg-white p-4 shadow-xs transition-all duration-150 dark:border-zinc-800 dark:bg-zinc-900";

  return to ? (
    <Link to={to} className={cn(className, "hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:hover:border-zinc-700")}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="mt-3 h-8 w-12" />
      <Skeleton className="mt-2 h-3 w-24" />
    </div>
  );
}
