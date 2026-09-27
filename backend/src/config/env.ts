import "dotenv/config";
import { z } from "zod";

/**
 * All configuration comes from environment variables and is validated once at
 * startup, so a misconfigured deployment fails fast with a clear message
 * instead of misbehaving at runtime.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  // Comma-separated list of allowed frontend origins, e.g. "https://taskflow.vercel.app,http://localhost:5173"
  CLIENT_URL: z.string().default("http://localhost:5173"),
  // Number of reverse proxies in front of the app (Render/Railway = 1). Needed for correct client IPs in rate limiting.
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  // Optional: send password-reset emails through Resend (https://resend.com). Without it, links are logged.
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("TaskFlow <onboarding@resend.dev>"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

const data = parsed.data;

export const env = {
  ...data,
  isProduction: data.NODE_ENV === "production",
  isTest: data.NODE_ENV === "test",
  clientOrigins: data.CLIENT_URL.split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean),
};
