import axios, { type AxiosError } from "axios";
import type { ApiFailure } from "../types";

const TOKEN_KEY = "taskflow-token";

/** Base URL of the backend, e.g. https://taskflow-api.onrender.com (no /api suffix). */
export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

/**
 * JWT storage. The token is kept in localStorage so sessions survive reloads.
 * React escapes all rendered content and no HTML is injected from user data,
 * which is the main XSS vector a stolen token would require.
 */
export const tokenStorage = {
  get: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* storage unavailable (private mode) */
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

/** Set by the realtime client so the server can skip echoing our own changes back. */
let socketId: string | undefined;
export const setSocketId = (id: string | undefined) => {
  socketId = id;
};

export const UNAUTHORIZED_EVENT = "taskflow:unauthorized";

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (socketId) config.headers["X-Socket-Id"] = socketId;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiFailure>) => {
    // A 401 on an authenticated request means the session is gone (expired, revoked, password changed).
    const sentToken = !!error.config?.headers?.Authorization;
    if (error.response?.status === 401 && sentToken) {
      window.dispatchEvent(
        new CustomEvent(UNAUTHORIZED_EVENT, {
          detail: error.response.data?.message ?? "Your session has expired. Please log in again.",
        }),
      );
    }
    return Promise.reject(error);
  },
);
