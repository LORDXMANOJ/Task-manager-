import type { Response } from "express";

/** Consistent success envelope: { success: true, data, message? } */
export function sendSuccess<T>(res: Response, data: T, statusCode = 200, message?: string) {
  return res.status(statusCode).json({
    success: true,
    ...(message ? { message } : {}),
    data,
  });
}
