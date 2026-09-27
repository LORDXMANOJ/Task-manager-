import { useId } from "react";
import { cn } from "../../utils/cn";

/** TaskFlow mark: a check that flows into a forward stroke. */
export function LogoMark({ className }: { className?: string }) {
  // Unique per instance: a duplicate id would point at a hidden copy (e.g. the collapsed sidebar) and not render.
  const gradientId = `tf-grad-${useId().replace(/:/g, "")}`;
  return (
    <svg viewBox="0 0 32 32" className={cn("h-8 w-8 shrink-0", className)} aria-hidden>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366f1" />
          <stop offset="1" stopColor="#4338ca" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${gradientId})`} />
      <path d="M8.5 16.5l4.5 4.5 7-8" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 13h3.5" fill="none" stroke="#c7d2fe" strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className, collapsed = false }: { className?: string; collapsed?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      {!collapsed && (
        <span className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">
          Task<span className="text-indigo-600 dark:text-indigo-400">Flow</span>
        </span>
      )}
    </span>
  );
}
