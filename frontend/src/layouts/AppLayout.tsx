import { Suspense, useState } from "react";
import { Outlet } from "react-router-dom";
import { MobileHeader, MobileNav } from "../components/layout/MobileNav";
import { Sidebar } from "../components/layout/Sidebar";
import { useAuth } from "../context/AuthContext";
import { TaskModalProvider } from "../context/TaskModalContext";
import { useRealtimeTasks } from "../hooks/useRealtimeTasks";
import { cn } from "../utils/cn";
import { Skeleton } from "../components/ui/Skeleton";

const COLLAPSE_KEY = "taskflow-sidebar-collapsed";

function initialCollapsed(): boolean {
  try {
    const saved = localStorage.getItem(COLLAPSE_KEY);
    if (saved !== null) return saved === "true";
  } catch {
    /* ignore */
  }
  // Tablets start with the icon rail to leave room for content.
  return window.innerWidth < 1024;
}

/** Authenticated shell: sidebar (desktop/tablet), top bar + bottom nav (phone). */
export function AppLayout() {
  const { token } = useAuth();
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  useRealtimeTasks(token);

  const toggle = () =>
    setCollapsed((prev) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, String(!prev));
      } catch {
        /* ignore */
      }
      return !prev;
    });

  return (
    <TaskModalProvider>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-lg dark:focus:bg-zinc-900"
      >
        Skip to content
      </a>
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <MobileHeader />
      <div className={cn("min-h-dvh transition-[padding] duration-200", collapsed ? "md:pl-[72px]" : "md:pl-64")}>
        <main id="main" className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 md:pb-12 md:pt-8 lg:px-10">
          <Suspense
            fallback={
              <div className="space-y-4" aria-busy="true">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-80 max-w-full" />
                <Skeleton className="h-40 w-full rounded-xl" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
      <MobileNav />
    </TaskModalProvider>
  );
}
