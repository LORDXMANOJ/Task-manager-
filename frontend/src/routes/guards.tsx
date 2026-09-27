import { WifiOff } from "lucide-react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { LogoMark } from "../components/ui/Logo";
import { useAuth } from "../context/AuthContext";

export function FullPageLoader() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4" role="status" aria-live="polite">
      <LogoMark className="h-10 w-10 animate-pulse" />
      <span className="text-sm text-zinc-500 dark:text-zinc-400">Loading your workspace...</span>
    </div>
  );
}

function OfflineScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
        <WifiOff className="h-6 w-6" aria-hidden />
      </span>
      <h1 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Can&apos;t reach TaskFlow</h1>
      <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
        Check your internet connection. If you&apos;re online, the server may be waking up; try again in a moment.
      </p>
      <Button className="mt-6" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

/** Only logged-in users; everyone else is sent to /login (and returned afterwards). */
export function ProtectedRoute() {
  const { status, retry } = useAuth();
  const location = useLocation();

  if (status === "loading") return <FullPageLoader />;
  if (status === "offline") return <OfflineScreen onRetry={retry} />;
  if (status === "unauthenticated") {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <Outlet />;
}

/** Login/register pages: logged-in users go straight to the dashboard. */
export function PublicOnlyRoute() {
  const { status } = useAuth();
  if (status === "loading") return <FullPageLoader />;
  if (status === "authenticated") return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
