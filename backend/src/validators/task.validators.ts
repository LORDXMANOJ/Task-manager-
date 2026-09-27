import { z } from "zod";
import { TaskPriority, TaskStatus } from "@prisma/client";
import { isValidTimeZone, parseDateOnly } from "../utils/dates";

export const STATUSES = Object.values(TaskStatus) as [TaskStatus, ...TaskStatus[]];
export const PRIORITIES = Object.values(TaskPriority) as [TaskPriority, ...TaskPriority[]];

const titleSchema = z
  .string({ error: "Title is required" })
  .trim()
  .min(1, "Title is required")
  .max(200, "Title must be at most 200 characters");

// Empty string / null clears the description.
const descriptionSchema = z
  .string({ error: "Description must be text" })
  .trim()
  .max(2000, "Description must be at most 2000 characters")
  .nullable()
  .transform((value) => (value ? value : null));

const statusSchema = z.enum(STATUSES, { error: "Status must be one of TODO, IN_PROGRESS, COMPLETED" });
const prioritySchema = z.enum(PRIORITIES, { error: "Priority must be one of LOW, MEDIUM, HIGH" });

// "YYYY-MM-DD" (a full ISO timestamp is accepted and truncated to its date). Empty string / null clears it.
const dueDateSchema = z
  .union([z.string(), z.null()], { error: "Due date must be a date (YYYY-MM-DD)" })
  .transform((value, ctx) => {
    if (value === null || value.trim() === "") return null;
    const date = parseDateOnly(value.trim().slice(0, 10));
    if (!date) {
      ctx.addIssue({ code: "custom", message: "Due date must be a valid date (YYYY-MM-DD)" });
      return z.NEVER;
    }
    const year = date.getUTCFullYear();
    if (year < 2000 || year > 2100) {
      ctx.addIssue({ code: "custom", message: "Due date must be between the years 2000 and 2100" });
      return z.NEVER;
    }
    return date;
  });

/** POST and PUT: full representation. Optional fields fall back to defaults. */
export const createTaskSchema = z.strictObject({
  title: titleSchema,
  description: descriptionSchema.optional().default(null),
  status: statusSchema.optional().default("TODO"),
  priority: prioritySchema.optional().default("MEDIUM"),
  dueDate: dueDateSchema.optional().default(null),
});

export const replaceTaskSchema = createTaskSchema;

/** PATCH: any subset of fields, at least one. */
export const patchTaskSchema = z
  .strictObject({
    title: titleSchema.optional(),
    description: descriptionSchema.optional(),
    status: statusSchema.optional(),
    priority: prioritySchema.optional(),
    dueDate: dueDateSchema.optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "Provide at least one field to update",
  });

export const statusUpdateSchema = z.strictObject({
  status: statusSchema,
});

export const taskIdParamsSchema = z.object({
  id: z.uuid("Invalid task id"),
});

const csvEnum = <T extends string>(values: [T, ...T[]], label: string) =>
  z
    .string()
    .optional()
    .transform((value, ctx) => {
      if (!value || value.toUpperCase() === "ALL") return undefined;
      const items = [...new Set(value.split(",").map((item) => item.trim().toUpperCase()))];
      const invalid = items.filter((item) => !values.includes(item as T));
      if (invalid.length) {
        ctx.addIssue({ code: "custom", message: `Invalid ${label}: ${invalid.join(", ")}` });
        return z.NEVER;
      }
      return items as T[];
    });

export const SORT_OPTIONS = ["newest", "oldest", "dueDate", "priority", "updated"] as const;
export const DUE_FILTERS = ["all", "today", "week", "overdue", "none"] as const;

export const listTasksQuerySchema = z.object({
  search: z.string().trim().max(100, "Search is too long").optional(),
  status: csvEnum(STATUSES, "status"),
  priority: csvEnum(PRIORITIES, "priority"),
  due: z.enum(DUE_FILTERS, { error: "Invalid due date filter" }).optional().default("all"),
  sort: z.enum(SORT_OPTIONS, { error: "Invalid sort option" }).optional().default("newest"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  // Client's IANA time zone so "today"/"overdue" match the user's calendar.
  tz: z
    .string()
    .optional()
    .default("UTC")
    .refine((tz) => isValidTimeZone(tz), "Invalid time zone"),
});

export const statsQuerySchema = z.object({
  tz: listTasksQuerySchema.shape.tz,
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type PatchTaskInput = z.infer<typeof patchTaskSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
