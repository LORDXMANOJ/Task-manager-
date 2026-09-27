import { Prisma, type Task, type TaskStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { toTaskDTO, type TaskDTO } from "../models/task.model";
import { ApiError } from "../utils/ApiError";
import { parseDateOnly, todayInTimeZone, weekRange } from "../utils/dates";
import type { CreateTaskInput, ListTasksQuery, PatchTaskInput } from "../validators/task.validators";

export interface PaginatedTasks {
  tasks: TaskDTO[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  completed: number;
  overdue: number;
  dueToday: number;
  completionRate: number;
  byPriority: { LOW: number; MEDIUM: number; HIGH: number };
}

/**
 * Every query below is scoped by userId. Tasks belonging to someone else are
 * reported as "not found" (never "forbidden") so their existence isn't leaked.
 */
async function findOwnedTask(userId: string, taskId: string): Promise<Task> {
  const task = await prisma.task.findFirst({ where: { id: taskId, userId } });
  if (!task) throw ApiError.notFound("Task not found");
  return task;
}

/** Keeps completedAt consistent with status transitions. */
function completedAtFor(nextStatus: TaskStatus | undefined, current?: Task): Date | null | undefined {
  if (nextStatus === undefined) return undefined;
  if (nextStatus !== "COMPLETED") return null;
  return current?.status === "COMPLETED" ? current.completedAt : new Date();
}

function todayDate(tz: string): Date {
  return parseDateOnly(todayInTimeZone(tz))!;
}

function buildWhere(userId: string, query: ListTasksQuery): Prisma.TaskWhereInput {
  const and: Prisma.TaskWhereInput[] = [{ userId }];

  if (query.search) {
    and.push({
      OR: [
        { title: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ],
    });
  }
  if (query.status) and.push({ status: { in: query.status } });
  if (query.priority) and.push({ priority: { in: query.priority } });

  const today = todayDate(query.tz);
  switch (query.due) {
    case "today":
      and.push({ dueDate: today });
      break;
    case "week": {
      const { start, end } = weekRange(today);
      and.push({ dueDate: { gte: start, lte: end } });
      break;
    }
    case "overdue":
      and.push({ dueDate: { lt: today }, status: { not: "COMPLETED" } });
      break;
    case "none":
      and.push({ dueDate: null });
      break;
  }

  return { AND: and };
}

function buildOrderBy(sort: ListTasksQuery["sort"]): Prisma.TaskOrderByWithRelationInput[] {
  const dueAsc: Prisma.TaskOrderByWithRelationInput = { dueDate: { sort: "asc", nulls: "last" } };
  switch (sort) {
    case "oldest":
      return [{ createdAt: "asc" }, { id: "asc" }];
    case "dueDate":
      return [dueAsc, { createdAt: "desc" }, { id: "asc" }];
    case "priority":
      // Enum sorts in declaration order (LOW < MEDIUM < HIGH), so desc puts HIGH first.
      return [{ priority: "desc" }, dueAsc, { id: "asc" }];
    case "updated":
      return [{ updatedAt: "desc" }, { id: "asc" }];
    case "newest":
    default:
      return [{ createdAt: "desc" }, { id: "asc" }];
  }
}

export async function listTasks(userId: string, query: ListTasksQuery): Promise<PaginatedTasks> {
  const where = buildWhere(userId, query);

  const [total, tasks] = await prisma.$transaction([
    prisma.task.count({ where }),
    prisma.task.findMany({
      where,
      orderBy: buildOrderBy(query.sort),
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
  ]);

  return {
    tasks: tasks.map(toTaskDTO),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

export async function getTask(userId: string, taskId: string): Promise<TaskDTO> {
  return toTaskDTO(await findOwnedTask(userId, taskId));
}

export async function createTask(userId: string, input: CreateTaskInput): Promise<TaskDTO> {
  const task = await prisma.task.create({
    data: {
      ...input,
      userId,
      completedAt: input.status === "COMPLETED" ? new Date() : null,
    },
  });
  return toTaskDTO(task);
}

/** PUT: replaces all editable fields. */
export async function replaceTask(userId: string, taskId: string, input: CreateTaskInput): Promise<TaskDTO> {
  const current = await findOwnedTask(userId, taskId);
  const task = await prisma.task.update({
    where: { id: current.id },
    data: { ...input, completedAt: completedAtFor(input.status, current) },
  });
  return toTaskDTO(task);
}

/** PATCH: updates only the provided fields. */
export async function patchTask(userId: string, taskId: string, input: PatchTaskInput): Promise<TaskDTO> {
  const current = await findOwnedTask(userId, taskId);
  const task = await prisma.task.update({
    where: { id: current.id },
    data: { ...input, completedAt: completedAtFor(input.status, current) },
  });
  return toTaskDTO(task);
}

export async function deleteTask(userId: string, taskId: string): Promise<void> {
  const current = await findOwnedTask(userId, taskId);
  await prisma.task.delete({ where: { id: current.id } });
}

export async function getStats(userId: string, tz: string): Promise<TaskStats> {
  const today = todayDate(tz);

  const [byStatus, openByPriority, overdue, dueToday] = await prisma.$transaction([
    prisma.task.groupBy({ by: ["status"], where: { userId }, _count: { _all: true }, orderBy: { status: "asc" } }),
    prisma.task.groupBy({
      by: ["priority"],
      where: { userId, status: { not: "COMPLETED" } },
      _count: { _all: true },
      orderBy: { priority: "asc" },
    }),
    prisma.task.count({ where: { userId, status: { not: "COMPLETED" }, dueDate: { lt: today } } }),
    prisma.task.count({ where: { userId, status: { not: "COMPLETED" }, dueDate: today } }),
  ]);

  const countStatus = (status: TaskStatus) => {
    const row = byStatus.find((r) => r.status === status);
    return typeof row?._count === "object" ? (row._count._all ?? 0) : 0;
  };
  const countPriority = (priority: "LOW" | "MEDIUM" | "HIGH") => {
    const row = openByPriority.find((r) => r.priority === priority);
    return typeof row?._count === "object" ? (row._count._all ?? 0) : 0;
  };

  const todo = countStatus("TODO");
  const inProgress = countStatus("IN_PROGRESS");
  const completed = countStatus("COMPLETED");
  const total = todo + inProgress + completed;

  return {
    total,
    todo,
    inProgress,
    completed,
    overdue,
    dueToday,
    completionRate: total === 0 ? 0 : Math.round((completed / total) * 100),
    byPriority: { LOW: countPriority("LOW"), MEDIUM: countPriority("MEDIUM"), HIGH: countPriority("HIGH") },
  };
}
