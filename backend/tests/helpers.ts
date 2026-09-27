import request from "supertest";
import { createApp } from "../src/app";
import { prisma } from "../src/config/prisma";

export const app = createApp();
export const api = () => request(app);

export async function resetDatabase() {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "tasks", "password_reset_tokens", "revoked_tokens", "users" RESTART IDENTITY CASCADE',
  );
}

let counter = 0;

export async function registerUser(overrides: Partial<{ name: string; email: string; password: string }> = {}) {
  counter += 1;
  const body = {
    name: overrides.name ?? `User ${counter}`,
    email: overrides.email ?? `user${counter}-${Date.now()}@example.com`,
    password: overrides.password ?? "Password123",
    confirmPassword: overrides.password ?? "Password123",
  };
  const res = await api().post("/api/auth/register").send(body);
  if (res.status !== 201) throw new Error(`Register failed: ${res.status} ${JSON.stringify(res.body)}`);
  return { token: res.body.data.token as string, user: res.body.data.user, password: body.password };
}

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

export { prisma };
