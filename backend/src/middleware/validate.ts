import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

type Source = "body" | "query" | "params";

/**
 * Validates and normalises a request part with a Zod schema.
 * The parsed value is stored on res.locals[source] (Express 5 makes req.query
 * read-only), and ZodErrors are turned into 400 responses by the error handler.
 */
export function validate(schema: ZodType, source: Source = "body") {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source] ?? {});
    if (!result.success) return next(result.error);
    res.locals[source] = result.data;
    next();
  };
}
