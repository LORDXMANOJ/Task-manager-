import type { Request, Response } from "express";
import { currentUser } from "../middleware/auth";
import * as authService from "../services/auth.service";
import { revokeToken } from "../services/token.service";
import { sendSuccess } from "../utils/response";

export async function register(_req: Request, res: Response) {
  const result = await authService.register(res.locals.body);
  sendSuccess(res, result, 201, "Account created successfully");
}

export async function login(_req: Request, res: Response) {
  const result = await authService.login(res.locals.body);
  sendSuccess(res, result, 200, "Logged in successfully");
}

export async function logout(req: Request, res: Response) {
  const { tokenJti, tokenExp } = currentUser(req);
  await revokeToken(tokenJti, tokenExp);
  sendSuccess(res, null, 200, "Logged out successfully");
}

export async function me(req: Request, res: Response) {
  const user = await authService.getUserById(currentUser(req).id);
  sendSuccess(res, { user });
}

export async function forgotPassword(_req: Request, res: Response) {
  const result = await authService.requestPasswordReset(res.locals.body.email);
  sendSuccess(res, result, 200, "If an account exists for that email, a reset link has been sent.");
}

export async function resetPassword(_req: Request, res: Response) {
  await authService.resetPassword(res.locals.body);
  sendSuccess(res, null, 200, "Your password has been reset. You can now log in.");
}
