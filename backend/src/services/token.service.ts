import crypto from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";

export interface AccessTokenPayload {
  sub: string; // user id
  ver: number; // user.tokenVersion at issue time
  jti: string; // unique token id, used for logout revocation
  exp: number;
}

export interface AuthenticatedUser {
  id: string;
  tokenJti: string;
  tokenExp: number;
}

export function signAccessToken(userId: string, tokenVersion: number): string {
  return jwt.sign({ ver: tokenVersion }, env.JWT_SECRET, {
    subject: userId,
    jwtid: crypto.randomUUID(),
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
    algorithm: "HS256",
  });
}

/**
 * Verifies signature and expiry, then checks the token is still valid:
 * not revoked by logout and not issued before the last password change.
 * Shared by the HTTP middleware and the Socket.IO handshake.
 */
export async function verifyAccessToken(token: string): Promise<AuthenticatedUser> {
  let payload: AccessTokenPayload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] }) as AccessTokenPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw ApiError.unauthorized("Your session has expired. Please log in again.");
    }
    throw ApiError.unauthorized("Invalid authentication token");
  }

  if (!payload.sub || !payload.jti) {
    throw ApiError.unauthorized("Invalid authentication token");
  }

  const [user, revoked] = await Promise.all([
    prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, tokenVersion: true } }),
    prisma.revokedToken.findUnique({ where: { jti: payload.jti }, select: { jti: true } }),
  ]);

  if (!user || revoked || user.tokenVersion !== payload.ver) {
    throw ApiError.unauthorized("Your session has expired. Please log in again.");
  }

  return { id: user.id, tokenJti: payload.jti, tokenExp: payload.exp };
}

export async function revokeToken(jti: string, expUnixSeconds: number): Promise<void> {
  await prisma.revokedToken.upsert({
    where: { jti },
    create: { jti, expiresAt: new Date(expUnixSeconds * 1000) },
    update: {},
  });
  // Opportunistic cleanup of entries that can no longer be used anyway.
  await prisma.revokedToken.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}

/** Random URL-safe token plus its SHA-256 hash (only the hash is stored). */
export function createOpaqueToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(32).toString("base64url");
  return { token, hash: hashOpaqueToken(token) };
}

export function hashOpaqueToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
