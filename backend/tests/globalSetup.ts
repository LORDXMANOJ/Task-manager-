import { execSync } from "node:child_process";
import dotenv from "dotenv";

/** Applies migrations to the test database (DATABASE_URL from .env.test) once before the suite. */
export default function setup() {
  const env = dotenv.config({ path: ".env.test", override: true }).parsed ?? {};
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, ...env },
  });
}
