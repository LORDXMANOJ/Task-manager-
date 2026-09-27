import { io, type Socket } from "socket.io-client";
import { API_URL, setSocketId } from "./api";

export const realtimeEnabled = import.meta.env.VITE_ENABLE_REALTIME !== "false";

/**
 * Opens an authenticated Socket.IO connection. The server places the socket in
 * a room for this user only. The app works without it; realtime only saves a refresh.
 */
export function connectRealtime(token: string): Socket {
  const socket = io(API_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnectionDelayMax: 10_000,
  });

  socket.on("connect", () => setSocketId(socket.id));
  socket.on("disconnect", () => setSocketId(undefined));

  return socket;
}

export function disconnectRealtime(socket: Socket | null) {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  setSocketId(undefined);
}
