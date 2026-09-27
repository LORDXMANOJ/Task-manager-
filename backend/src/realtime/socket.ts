import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { env } from "../config/env";
import { verifyAccessToken } from "../services/token.service";

/**
 * Optional real-time layer. Each authenticated socket joins a private room
 * named after its user id; task mutations are broadcast only to that room, so
 * users never receive events about other users' tasks.
 *
 * If the socket server is not initialised (e.g. in tests), emits are no-ops
 * and the REST API keeps working unchanged.
 */

export type TaskEvent = "task:created" | "task:updated" | "task:deleted";

let io: Server | null = null;

const userRoom = (userId: string) => `user:${userId}`;

export function initRealtime(server: HttpServer): Server {
  io = new Server(server, {
    cors: { origin: env.clientOrigins, credentials: true },
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (typeof token !== "string" || !token) return next(new Error("Authentication required"));
    try {
      const user = await verifyAccessToken(token);
      socket.data.userId = user.id;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(userRoom(socket.data.userId));
  });

  return io;
}

/**
 * Notify the user's other open tabs/devices. The socket that triggered the
 * change (sent by the client as the X-Socket-Id header) is excluded because it
 * already updated its own UI.
 */
export function emitToUser(userId: string, event: TaskEvent, payload: unknown, excludeSocketId?: string) {
  if (!io) return;
  const target = io.to(userRoom(userId));
  (excludeSocketId ? target.except(excludeSocketId) : target).emit(event, payload);
}

export function closeRealtime(): Promise<void> {
  return new Promise((resolve) => {
    if (!io) return resolve();
    io.close(() => resolve());
    io = null;
  });
}
