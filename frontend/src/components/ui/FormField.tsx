import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** Label + control + hint/error, with the ids wired for screen readers. */
export function FormField({ id, label, error, hint, optional, action, className, children }: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
          {optional && <span className="ml-1 font-normal text-zinc-400 dark:text-zinc-500">(optional)</span>}
        </label>
        {action}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="flex items-start gap-1.5 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-zinc-500 dark:text-zinc-400">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const controlClass = (hasError?: boolean) =>
  cn(
    "block w-full rounded-lg border bg-white px-3 text-sm text-zinc-900 shadow-xs transition-colors placeholder:text-zinc-400",
    "focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60",
    "dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500",
    hasError
      ? "border-red-400 focus:border-red-500 focus:ring-red-500/15 dark:border-red-500/60"
      : "border-zinc-200 focus:border-indigo-500 focus:ring-indigo-500/15 dark:border-zinc-700 dark:focus:border-indigo-400",
  );
