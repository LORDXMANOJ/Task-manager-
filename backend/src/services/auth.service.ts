import { env } from "../config/env";
import { prisma } from "../config/prisma";
import { toPublicUser, type PublicUser } from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import type { LoginInput, RegisterInput, ResetPasswordInput } from "../validators/auth.validators";
import { passwordResetEmail, sendEmail } from "./email.service";
import { burnPasswordCheck, hashPassword, verifyPassword } from "./password.service";
import { createOpaqueToken, hashOpaqueToken, signAccessToken } from "./token.service";

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

export interface AuthResult {
  user: PublicUser;
  token: string;
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (existing) {
    throw ApiError.conflict("An account with this email already exists", {
      email: "An account with this email already exists",
    });
  }

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password),
    },
  });

  return { user: toPublicUser(user), token: signAccessToken(user.id, user.tokenVersion) };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  // Same message for unknown email and wrong password so attackers can't probe for accounts.
  if (!user) {
    await burnPasswordCheck(input.password);
    throw ApiError.unauthorized("Incorrect email or password");
  }
  if (!(await verifyPassword(input.password, user.passwordHash))) {
    throw ApiError.unauthorized("Incorrect email or password");
  }

  return { user: toPublicUser(user), token: signAccessToken(user.id, user.tokenVersion) };
}

export async function getUserById(userId: string): Promise<PublicUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.unauthorized("Your account no longer exists");
  return toPublicUser(user);
}

/**
 * Always resolves without revealing whether the email is registered.
 * Returns the reset URL outside production so the flow can be tested without an email provider.
 */
export async function requestPasswordReset(email: string): Promise<{ devResetUrl?: string }> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return {};

  // Invalidate any previous unused links for this user.
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

  const { token, hash } = createOpaqueToken();
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash: hash, expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS) },
  });

  const resetUrl = `${env.clientOrigins[0]}/reset-password?token=${encodeURIComponent(token)}`;
  await sendEmail({ to: user.email, ...passwordResetEmail(user.name, resetUrl) });

  return env.isProduction ? {} : { devResetUrl: resetUrl };
}

export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashOpaqueToken(input.token) },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw ApiError.badRequest("This reset link is invalid or has expired. Please request a new one.");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      // Bumping tokenVersion signs the user out everywhere.
      data: { passwordHash: await hashPassword(input.password), tokenVersion: { increment: 1 } },
    }),
    prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
  ]);
}
