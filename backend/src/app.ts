import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { apiLimiter } from "./middleware/rateLimit";
import apiRoutes from "./routes";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  if (env.TRUST_PROXY > 0) app.set("trust proxy", env.TRUST_PROXY);

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        // Allow non-browser clients (curl, health checks) that send no Origin header.
        if (!origin || env.clientOrigins.includes(origin)) return callback(null, true);
        callback(null, false);
      },
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Socket-Id"],
      maxAge: 600,
    }),
  );
  app.use(express.json({ limit: "100kb" }));

  app.get("/", (_req, res) => {
    res.json({ success: true, data: { name: "TaskFlow API", docs: "/api/health" } });
  });

  app.use("/api", apiLimiter, apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
