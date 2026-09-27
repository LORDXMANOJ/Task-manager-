import type { Request, Response } from "express";
import { currentUser } from "../middleware/auth";
import { emitToUser } from "../realtime/socket";
import * as taskService from "../services/task.service";
import { sendSuccess } from "../utils/response";

const originSocket = (req: Request) => req.get("x-socket-id") || undefined;

export async function list(req: Request, res: Response) {
  const result = await taskService.listTasks(currentUser(req).id, res.locals.query);
  sendSuccess(res, result);
}

export async function stats(req: Request, res: Response) {
  const result = await taskService.getStats(currentUser(req).id, res.locals.query.tz);
  sendSuccess(res, { stats: result });
}

export async function getOne(req: Request, res: Response) {
  const task = await taskService.getTask(currentUser(req).id, res.locals.params.id);
  sendSuccess(res, { task });
}

export async function create(req: Request, res: Response) {
  const userId = currentUser(req).id;
  const task = await taskService.createTask(userId, res.locals.body);
  emitToUser(userId, "task:created", { task }, originSocket(req));
  sendSuccess(res, { task }, 201, "Task created");
}

export async function replace(req: Request, res: Response) {
  const userId = currentUser(req).id;
  const task = await taskService.replaceTask(userId, res.locals.params.id, res.locals.body);
  emitToUser(userId, "task:updated", { task }, originSocket(req));
  sendSuccess(res, { task }, 200, "Task updated");
}

export async function patch(req: Request, res: Response) {
  const userId = currentUser(req).id;
  const task = await taskService.patchTask(userId, res.locals.params.id, res.locals.body);
  emitToUser(userId, "task:updated", { task }, originSocket(req));
  sendSuccess(res, { task }, 200, "Task updated");
}

export async function remove(req: Request, res: Response) {
  const userId = currentUser(req).id;
  const id = res.locals.params.id;
  await taskService.deleteTask(userId, id);
  emitToUser(userId, "task:deleted", { id }, originSocket(req));
  sendSuccess(res, { id }, 200, "Task deleted");
}
