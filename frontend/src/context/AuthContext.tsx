import { useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { tokenStorage, UNAUTHORIZED_EVENT } from "../services/api";
import { authService } from "../services/auth.service";
import type { User } from "../types";
import { isNetworkError } from "../utils/errors";
import type { LoginValues, RegisterValues } from "../utils/validation";

type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "offline";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  status: AuthStatus;
  login: (values: LoginValues) => Promise<void>;
  register: (values: RegisterValues) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  /** Replace the stored token (e.g. after a password change). */
  replaceToken: (token: string) => void;
  retry: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() => tokenStorage.get());
  const [user, setUserState] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>(() => (tokenStorage.get() ? "loading" : "unauthenticated"));
  const [attempt, setAttempt] = useState(0);

  const clearSession = useCallback(() => {
    tokenStorage.clear();
    setToken(null);
    setUserState(null);
    setStatus("unauthenticated");
    queryClient.clear();
  }, [queryClient]);

  // Restore the session on load by validating the stored token with the API.
  useEffect(() => {
    const stored = tokenStorage.get();
    if (!stored) return;
    let cancelled = false;
    setStatus("loading");
    authService
      .me()
      .then((me) => {
        if (cancelled) return;
        setUserState(me);
        setStatus("authenticated");
      })
      .catch((err) => {
        if (cancelled) return;
        // Keep the token if the server is simply unreachable; the user can retry.
        if (isNetworkError(err)) setStatus("offline");
        else clearSession();
      });
    return () => {
      cancelled = true;
    };
  }, [attempt, clearSession]);

  // Any 401 from an authenticated request signs the user out.
  useEffect(() => {
    const onUnauthorized = (event: Event) => {
      if (!tokenStorage.get()) return;
      clearSession();
      toast.error((event as CustomEvent<string>).detail);
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [clearSession]);

  // Keep tabs in sync: logging out in one tab logs out the others.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== "taskflow-token") return;
      if (!event.newValue) clearSession();
      else if (event.newValue !== token) {
        setToken(event.newValue);
        setAttempt((n) => n + 1);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [clearSession, token]);

  const startSession = useCallback(
    (nextToken: string, nextUser: User) => {
      queryClient.clear();
      tokenStorage.set(nextToken);
      setToken(nextToken);
      setUserState(nextUser);
      setStatus("authenticated");
    },
    [queryClient],
  );

  const login = useCallback(
    async (values: LoginValues) => {
      const result = await authService.login(values);
      startSession(result.token, result.user);
    },
    [startSession],
  );

  const register = useCallback(
    async (values: RegisterValues) => {
      const result = await authService.register(values);
      startSession(result.token, result.user);
    },
    [startSession],
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout(); // revokes the token server-side
    } catch {
      // Even if the request fails, the local session is cleared.
    }
    clearSession();
    toast.success("You've been logged out");
  }, [clearSession]);

  const replaceToken = useCallback((next: string) => {
    tokenStorage.set(next);
    setToken(next);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      status,
      login,
      register,
      logout,
      setUser: setUserState,
      replaceToken,
      retry: () => setAttempt((n) => n + 1),
    }),
    [user, token, status, login, register, logout, replaceToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
