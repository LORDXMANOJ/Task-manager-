import { prisma } from "../config/prisma";
import { toPublicUser, type PublicUser } from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import type { ChangePasswordInput } from "../validators/auth.validators";
import { hashPassword, verifyPassword } from "./password.service";
import { signAccessToken } from "./token.service";

export async function updateProfile(userId: string, name: string): Promise<PublicUser> {
  const user = await prisma.user.update({ where: { id: userId }, data: { name } });
  return toPublicUser(user);
}

/**
 * Changes the password and invalidates every existing session (tokenVersion++).
 * Returns a fresh token so the current device stays signed in.
 */
export async function changePassword(userId: string, input: ChangePasswordInput): Promise<{ token: string }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.unauthorized();

  if (!(await verifyPassword(input.currentPassword, user.passwordHash))) {
    throw ApiError.badRequest("Current password is incorrect", {
      currentPassword: "Current password is incorrect",
    });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(input.newPassword), tokenVersion: { increment: 1 } },
  });

  return { token: signAccessToken(updated.id, updated.tokenVersion) };
}

/** Permanently deletes the account; tasks are removed by the ON DELETE CASCADE relation. */
export async function deleteAccount(userId: string, password: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.unauthorized();

  if (!(await verifyPassword(password, user.passwordHash))) {
    throw ApiError.badRequest("Password is incorrect", { password: "Password is incorrect" });
  }

  await prisma.user.delete({ where: { id: userId } });
}
