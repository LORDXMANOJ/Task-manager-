import type { Request, Response } from "express";
import { currentUser } from "../middleware/auth";
import * as userService from "../services/user.service";
import { sendSuccess } from "../utils/response";

export async function updateProfile(req: Request, res: Response) {
  const user = await userService.updateProfile(currentUser(req).id, res.locals.body.name);
  sendSuccess(res, { user }, 200, "Profile updated");
}

export async function changePassword(req: Request, res: Response) {
  const result = await userService.changePassword(currentUser(req).id, res.locals.body);
  sendSuccess(res, result, 200, "Password changed. Other sessions have been signed out.");
}

export async function deleteAccount(req: Request, res: Response) {
  await userService.deleteAccount(currentUser(req).id, res.locals.body.password);
  sendSuccess(res, null, 200, "Your account has been deleted");
}
