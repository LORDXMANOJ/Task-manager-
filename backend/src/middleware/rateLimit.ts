import rateLimit from "express-rate-limit";
import { env } from "../config/env";

const message = { success: false, message: "Too many attempts. Please wait a few minutes and try again." };

/** Brute-force protection for login/register/password endpoints. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: () => env.isTest,
  message,
});

/** General safety net for the whole API. */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: () => env.isTest,
  message: { success: false, message: "Too many requests. Please slow down." },
});
