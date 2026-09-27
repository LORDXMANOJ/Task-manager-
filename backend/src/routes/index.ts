import { Router } from "express";
import { prisma } from "../config/prisma";
import { sendSuccess } from "../utils/response";
import authRoutes from "./auth.routes";
import taskRoutes from "./task.routes";
import userRoutes from "./user.routes";

const router = Router();

/** Health check used by Render/Railway. Verifies the database is reachable. */
router.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    sendSuccess(res, { status: "ok", database: "connected", time: new Date().toISOString() });
  } catch {
    res.status(503).json({ success: false, message: "Database unavailable" });
  }
});

router.use("/auth", authRoutes);
router.use("/tasks", taskRoutes);
router.use("/users", userRoutes);

export default router;
