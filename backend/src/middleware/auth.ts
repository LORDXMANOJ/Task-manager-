import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken, type AuthenticatedUser } from "../services/token.service";
import { ApiError } from "../utils/ApiError";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/** Requires a valid `Authorization: Bearer <jwt>` header and attaches req.user. */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(ApiError.unauthorized());
  }

  try {
    req.user = await verifyAccessToken(header.slice(7).trim());
    next();
  } catch (err) {
    next(err);
  }
}

/** Use inside handlers that sit behind requireAuth. */
export function currentUser(req: Request): AuthenticatedUser {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
}
