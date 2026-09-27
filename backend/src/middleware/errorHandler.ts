import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";

function zodErrorsToFields(error: ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    fields[key] ??= issue.message;
  }
  return fields;
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}

/**
 * Central error handler. Known errors become friendly messages with the right
 * status code; everything else is logged server-side and returned as a generic
 * 500 so database/internal details never reach the client.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors ? { errors: err.errors } : {}),
    });
  }

  if (err instanceof ZodError) {
    const errors = zodErrorsToFields(err);
    return res.status(400).json({
      success: false,
      message: Object.values(errors)[0] ?? "Invalid request data",
      errors,
    });
  }

  // Malformed JSON body
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ success: false, message: "Request body must be valid JSON" });
  }

  // Body too large (express.json limit)
  if (typeof err === "object" && err !== null && (err as { type?: string }).type === "entity.too.large") {
    return res.status(413).json({ success: false, message: "Request body is too large" });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({ success: false, message: "A record with these details already exists" });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ success: false, message: "Resource not found" });
    }
  }

  if (
    err instanceof Prisma.PrismaClientInitializationError ||
    (err instanceof Prisma.PrismaClientKnownRequestError && ["P1001", "P1002", "P1017"].includes(err.code))
  ) {
    console.error("[db] Database unavailable:", err.message);
    return res.status(503).json({
      success: false,
      message: "The service is temporarily unavailable. Please try again shortly.",
    });
  }

  console.error(`[error] ${req.method} ${req.originalUrl}`, err);
  return res.status(500).json({
    success: false,
    message: "Something went wrong on our end. Please try again.",
    ...(env.isProduction || !(err instanceof Error) ? {} : { debug: err.message }),
  });
}
