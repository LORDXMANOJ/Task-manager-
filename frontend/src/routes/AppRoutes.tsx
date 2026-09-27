import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout";
import { FullPageLoader, ProtectedRoute, PublicOnlyRoute } from "./guards";

// Route-level code splitting: each page is downloaded only when visited.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const named = <K extends string>(loader: () => Promise<Record<K, React.ComponentType<any>>>, name: K) =>
  lazy(() => loader().then((m) => ({ default: m[name] })));

const LoginPage = named(() => import("../pages/LoginPage"), "LoginPage");
const RegisterPage = named(() => import("../pages/RegisterPage"), "RegisterPage");
const ForgotPasswordPage = named(() => import("../pages/ForgotPasswordPage"), "ForgotPasswordPage");
const ResetPasswordPage = named(() => import("../pages/ResetPasswordPage"), "ResetPasswordPage");
const DashboardPage = named(() => import("../pages/DashboardPage"), "DashboardPage");
const TasksPage = named(() => import("../pages/TasksPage"), "TasksPage");
const SettingsPage = named(() => import("../pages/SettingsPage"), "SettingsPage");
const NotFoundPage = named(() => import("../pages/NotFoundPage"), "NotFoundPage");

export function AppRoutes() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>
        {/* Reachable whether or not someone is logged in */}
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/tasks" element={<TasksPage view="all" />} />
            <Route path="/tasks/pending" element={<TasksPage view="pending" />} />
            <Route path="/tasks/completed" element={<TasksPage view="completed" />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
