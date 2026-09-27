import axios from "axios";
import type { ApiFailure } from "../types";

/** Turns any thrown error into a message that is safe and useful to show the user. */
export function getErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (axios.isAxiosError<ApiFailure>(error)) {
    if (error.code === "ECONNABORTED") return "The request timed out. Please try again.";
    if (!error.response) return "Can't reach the server. Check your connection and try again.";
    const message = error.response.data?.message;
    if (typeof message === "string" && message) return message;
    if (error.response.status >= 500) return "The server ran into a problem. Please try again shortly.";
    return fallback;
  }
  return fallback;
}

/** Field-level validation errors returned by the API ({ errors: { field: message } }). */
export function getFieldErrors(error: unknown): Record<string, string> {
  if (axios.isAxiosError<ApiFailure>(error)) {
    return error.response?.data?.errors ?? {};
  }
  return {};
}

export function isNetworkError(error: unknown): boolean {
  return axios.isAxiosError(error) && !error.response;
}
