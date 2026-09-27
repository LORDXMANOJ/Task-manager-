import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { api, bearer, prisma, registerUser, resetDatabase } from "./helpers";

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

describe("POST /api/auth/register", () => {
  it("creates an account, hashes the password and returns a token", async () => {
    const res = await api().post("/api/auth/register").send({
      name: "Ada Lovelace",
      email: "ADA@Example.com",
      password: "Password123",
      confirmPassword: "Password123",
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user).toMatchObject({ name: "Ada Lovelace", email: "ada@example.com" });
    expect(res.body.data.user.passwordHash).toBeUndefined();

    const stored = await prisma.user.findUniqueOrThrow({ where: { email: "ada@example.com" } });
    expect(stored.passwordHash).not.toBe("Password123");
    expect(stored.passwordHash).toMatch(/^\$2[aby]\$12\$/);
  });

  it("rejects a duplicate email with 409", async () => {
    await registerUser({ email: "dup@example.com" });
    const res = await api().post("/api/auth/register").send({
      name: "Someone",
      email: "dup@example.com",
      password: "Password123",
      confirmPassword: "Password123",
    });
    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({ success: false, message: "An account with this email already exists" });
  });

  it("validates fields", async () => {
    const res = await api().post("/api/auth/register").send({
      name: "A",
      email: "not-an-email",
      password: "short",
      confirmPassword: "different",
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(Object.keys(res.body.errors)).toEqual(expect.arrayContaining(["name", "email", "password"]));
  });
});

describe("POST /api/auth/login", () => {
  it("logs in with correct credentials", async () => {
    await registerUser({ email: "login@example.com", password: "Password123" });
    const res = await api().post("/api/auth/login").send({ email: "login@example.com", password: "Password123" });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toEqual(expect.any(String));
  });

  it("returns the same 401 for wrong password and unknown email", async () => {
    await registerUser({ email: "login@example.com" });
    const wrong = await api().post("/api/auth/login").send({ email: "login@example.com", password: "Wrong1234" });
    const unknown = await api().post("/api/auth/login").send({ email: "nobody@example.com", password: "Wrong1234" });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.message).toBe(unknown.body.message);
  });
});

describe("protected routes and tokens", () => {
  it("GET /me requires a token", async () => {
    const res = await api().get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("rejects a tampered token", async () => {
    const { token } = await registerUser();
    const res = await api().get("/api/auth/me").set(bearer(`${token}x`));
    expect(res.status).toBe(401);
  });

  it("GET /me returns the current user", async () => {
    const { token, user } = await registerUser({ name: "Grace Hopper" });
    const res = await api().get("/api/auth/me").set(bearer(token));
    expect(res.status).toBe(200);
    expect(res.body.data.user).toMatchObject({ id: user.id, name: "Grace Hopper" });
  });

  it("logout revokes the token", async () => {
    const { token } = await registerUser();
    expect((await api().post("/api/auth/logout").set(bearer(token))).status).toBe(200);
    expect((await api().get("/api/auth/me").set(bearer(token))).status).toBe(401);
  });

  it("changing password invalidates old tokens and returns a new one", async () => {
    const { token } = await registerUser({ password: "Password123" });
    const res = await api()
      .patch("/api/users/me/password")
      .set(bearer(token))
      .send({ currentPassword: "Password123", newPassword: "NewPassword456", confirmPassword: "NewPassword456" });
    expect(res.status).toBe(200);
    expect((await api().get("/api/auth/me").set(bearer(token))).status).toBe(401);
    expect((await api().get("/api/auth/me").set(bearer(res.body.data.token))).status).toBe(200);
  });
});

describe("password reset", () => {
  it("resets the password with a valid link and the link is single-use", async () => {
    const { user } = await registerUser({ email: "reset@example.com", password: "Password123" });

    const forgot = await api().post("/api/auth/forgot-password").send({ email: "reset@example.com" });
    expect(forgot.status).toBe(200);
    const token = new URL(forgot.body.data.devResetUrl).searchParams.get("token")!;

    const reset = await api()
      .post("/api/auth/reset-password")
      .send({ token, password: "BrandNew789", confirmPassword: "BrandNew789" });
    expect(reset.status).toBe(200);

    const login = await api().post("/api/auth/login").send({ email: user.email, password: "BrandNew789" });
    expect(login.status).toBe(200);

    const reuse = await api()
      .post("/api/auth/reset-password")
      .send({ token, password: "Another789", confirmPassword: "Another789" });
    expect(reuse.status).toBe(400);
  });

  it("does not reveal whether an email exists", async () => {
    const res = await api().post("/api/auth/forgot-password").send({ email: "ghost@example.com" });
    expect(res.status).toBe(200);
    expect(res.body.data.devResetUrl).toBeUndefined();
  });
});
