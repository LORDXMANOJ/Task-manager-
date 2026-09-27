import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { connectRealtime, disconnectRealtime, realtimeEnabled } from "../services/socket";
import { invalidateTasks } from "./useTasks";

/**
 * Keeps the dashboard in sync when tasks change in another tab or device.
 * The server only emits to this user's private room.
 */
export function useRealtimeTasks(token: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token || !realtimeEnabled) return;

    let socket: ReturnType<typeof connectRealtime> | null = null;
    // Deferred so a mount that is immediately undone (React StrictMode in dev) never opens a socket.
    const timer = setTimeout(() => {
      socket = connectRealtime(token);
      const refresh = () => void invalidateTasks(queryClient);
      socket.on("task:created", refresh);
      socket.on("task:updated", refresh);
      socket.on("task:deleted", refresh);
      // Catch up on anything missed while disconnected.
      socket.io.on("reconnect", refresh);
    }, 0);

    return () => {
      clearTimeout(timer);
      disconnectRealtime(socket);
    };
  }, [token, queryClient]);
}
