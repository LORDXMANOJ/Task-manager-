import { Router } from "express";
import * as tasks from "../controllers/task.controller";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  createTaskSchema,
  listTasksQuerySchema,
  patchTaskSchema,
  replaceTaskSchema,
  statsQuerySchema,
  statusUpdateSchema,
  taskIdParamsSchema,
} from "../validators/task.validators";

const router = Router();

// Every task endpoint requires a logged-in user.
router.use(requireAuth);

const byId = validate(taskIdParamsSchema, "params");

router.get("/", validate(listTasksQuerySchema, "query"), tasks.list);
router.get("/stats", validate(statsQuerySchema, "query"), tasks.stats);
router.post("/", validate(createTaskSchema), tasks.create);
router.get("/:id", byId, tasks.getOne);
router.put("/:id", byId, validate(replaceTaskSchema), tasks.replace);
router.patch("/:id", byId, validate(patchTaskSchema), tasks.patch);
router.patch("/:id/status", byId, validate(statusUpdateSchema), tasks.patch);
router.delete("/:id", byId, tasks.remove);

export default router;
