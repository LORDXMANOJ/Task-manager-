import http from "node:http";
import { createApp } from "./app";
import { env } from "./config/env";
import { prisma } from "./config/prisma";
import { closeRealtime, initRealtime } from "./realtime/socket";

async function main() {
  await prisma.$connect();
  console.log("[db] Connected to PostgreSQL");

  const server = http.createServer(createApp());
  initRealtime(server);

  server.listen(env.PORT, () => {
    console.log(`[server] TaskFlow API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
    console.log(`[server] Allowed origins: ${env.clientOrigins.join(", ")}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n[server] ${signal} received, shutting down...`);
    await closeRealtime(); // also closes the HTTP server
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch(async (err) => {
  console.error("[server] Failed to start:", err instanceof Error ? err.message : err);
  await prisma.$disconnect();
  process.exit(1);
});
