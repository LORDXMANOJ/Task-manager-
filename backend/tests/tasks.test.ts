import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { todayInTimeZone } from "../src/utils/dates";
import { api, bearer, prisma, registerUser, resetDatabase } from "./helpers";

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

const today = todayInTimeZone("UTC");
const shift = (days: number) => {
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

async function createTask(token: string, body: Record<string, unknown>) {
  const res = await api().post("/api/tasks").set(bearer(token)).send(body);
  if (res.status !== 201) throw new Error(`Create failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.data.task;
}

describe("task CRUD", () => {
  it("requires authentication", async () => {
    expect((await api().get("/api/tasks")).status).toBe(401);
    expect((await api().post("/api/tasks").send({ title: "x" })).status).toBe(401);
  });

  it("creates, reads, updates and deletes a task", async () => {
    const { token } = await registerUser();

    const created = await createTask(token, {
      title: "Complete internship project",
      description: "Finish the Task Management Application and deploy it.",
      status: "TODO",
      priority: "HIGH",
      dueDate: "2026-10-10",
    });
    expect(created).toMatchObject({ title: "Complete internship project", priority: "HIGH", dueDate: "2026-10-10" });

    const fetched = await api().get(`/api/tasks/${created.id}`).set(bearer(token));
    expect(fetched.status).toBe(200);
    expect(fetched.body.data.task.id).toBe(created.id);

    const put = await api()
      .put(`/api/tasks/${created.id}`)
      .set(bearer(token))
      .send({ title: "Renamed", status: "IN_PROGRESS", priority: "LOW", dueDate: null });
    expect(put.status).toBe(200);
    expect(put.body.data.task).toMatchObject({ title: "Renamed", status: "IN_PROGRESS", description: null, dueDate: null });

    const patch = await api().patch(`/api/tasks/${created.id}`).set(bearer(token)).send({ priority: "MEDIUM" });
    expect(patch.body.data.task).toMatchObject({ title: "Renamed", priority: "MEDIUM" });

    const status = await api().patch(`/api/tasks/${created.id}/status`).set(bearer(token)).send({ status: "COMPLETED" });
    expect(status.body.data.task.status).toBe("COMPLETED");
    expect(status.body.data.task.completedAt).toEqual(expect.any(String));

    const reopened = await api().patch(`/api/tasks/${created.id}/status`).set(bearer(token)).send({ status: "TODO" });
    expect(reopened.body.data.task.completedAt).toBeNull();

    const del = await api().delete(`/api/tasks/${created.id}`).set(bearer(token));
    expect(del.status).toBe(200);
    expect((await api().get(`/api/tasks/${created.id}`).set(bearer(token))).status).toBe(404);
  });

  it("validates input", async () => {
    const { token } = await registerUser();
    const cases = [
      { title: "" },
      { title: "ok", priority: "URGENT" },
      { title: "ok", status: "DONE" },
      { title: "ok", dueDate: "2026-02-31" },
      { title: "ok", dueDate: "tomorrow" },
      { title: "ok", unknownField: true },
    ];
    for (const body of cases) {
      const res = await api().post("/api/tasks").set(bearer(token)).send(body);
      expect(res.status, JSON.stringify(body)).toBe(400);
      expect(res.body.success).toBe(false);
    }
    const emptyPatch = await api().patch(`/api/tasks/${crypto.randomUUID()}`).set(bearer(token)).send({});
    expect(emptyPatch.status).toBe(400);
  });

  it("returns 400 for a malformed id and 404 for a missing task", async () => {
    const { token } = await registerUser();
    expect((await api().get("/api/tasks/not-a-uuid").set(bearer(token))).status).toBe(400);
    const missing = await api().get(`/api/tasks/${crypto.randomUUID()}`).set(bearer(token));
    expect(missing.status).toBe(404);
    expect(missing.body).toEqual({ success: false, message: "Task not found" });
  });
});

describe("authorization: users only see their own tasks", () => {
  it("User A cannot read, update or delete User B's task", async () => {
    const alice = await registerUser({ name: "Alice" });
    const bob = await registerUser({ name: "Bob" });
    const bobsTask = await createTask(bob.token, { title: "Bob's secret task" });

    const asAlice = bearer(alice.token);
    expect((await api().get(`/api/tasks/${bobsTask.id}`).set(asAlice)).status).toBe(404);
    expect((await api().put(`/api/tasks/${bobsTask.id}`).set(asAlice).send({ title: "hacked" })).status).toBe(404);
    expect((await api().patch(`/api/tasks/${bobsTask.id}`).set(asAlice).send({ title: "hacked" })).status).toBe(404);
    expect((await api().patch(`/api/tasks/${bobsTask.id}/status`).set(asAlice).send({ status: "COMPLETED" })).status).toBe(404);
    expect((await api().delete(`/api/tasks/${bobsTask.id}`).set(asAlice)).status).toBe(404);

    const list = await api().get("/api/tasks").set(asAlice);
    expect(list.body.data.tasks).toHaveLength(0);

    const unchanged = await prisma.task.findUniqueOrThrow({ where: { id: bobsTask.id } });
    expect(unchanged.title).toBe("Bob's secret task");
    expect(unchanged.status).toBe("TODO");
  });

  it("ignores a userId supplied in the body", async () => {
    const alice = await registerUser();
    const bob = await registerUser();
    const res = await api().post("/api/tasks").set(bearer(alice.token)).send({ title: "x", userId: bob.user.id });
    expect(res.status).toBe(400); // strict schema rejects unknown fields
  });
});

describe("search, filters, sorting and stats", () => {
  it("combines search, status, priority and due filters", async () => {
    const { token } = await registerUser();
    await createTask(token, { title: "Complete internship project", priority: "HIGH", status: "IN_PROGRESS", dueDate: shift(2) });
    await createTask(token, { title: "Project documentation", priority: "LOW", status: "COMPLETED", dueDate: shift(-3) });
    await createTask(token, { title: "Project deployment", priority: "HIGH", status: "TODO", dueDate: shift(-1) });
    await createTask(token, { title: "Buy groceries", description: "milk, eggs, project snacks", priority: "MEDIUM", dueDate: today });
    await createTask(token, { title: "No due date", priority: "LOW" });

    const get = (qs: string) => api().get(`/api/tasks?${qs}`).set(bearer(token));
    const titles = (res: { body: { data: { tasks: { title: string }[] } } }) =>
      res.body.data.tasks.map((t) => t.title).sort();

    expect(titles(await get("search=PROJECT"))).toEqual([
      "Buy groceries",
      "Complete internship project",
      "Project deployment",
      "Project documentation",
    ]);
    expect(titles(await get("priority=HIGH&status=IN_PROGRESS"))).toEqual(["Complete internship project"]);
    expect(titles(await get("status=TODO,IN_PROGRESS&priority=HIGH"))).toEqual([
      "Complete internship project",
      "Project deployment",
    ]);
    // Completed tasks are never overdue.
    expect(titles(await get("due=overdue"))).toEqual(["Project deployment"]);
    expect(titles(await get("due=today"))).toEqual(["Buy groceries"]);
    expect(titles(await get("due=none"))).toEqual(["No due date"]);
    expect((await get("status=BOGUS")).status).toBe(400);

    const byPriority = (await get("sort=priority")).body.data.tasks.map((t: { priority: string }) => t.priority);
    expect(byPriority.slice(0, 2)).toEqual(["HIGH", "HIGH"]);
    const byDue = (await get("sort=dueDate")).body.data.tasks.map((t: { dueDate: string | null }) => t.dueDate);
    expect(byDue).toEqual([shift(-3), shift(-1), today, shift(2), null]);
    const oldest = (await get("sort=oldest")).body.data.tasks[0].title;
    expect(oldest).toBe("Complete internship project");

    const paged = await get("limit=2&page=2");
    expect(paged.body.data.tasks).toHaveLength(2);
    expect(paged.body.data.pagination).toEqual({ page: 2, limit: 2, total: 5, totalPages: 3 });
  });

  it("returns per-user statistics", async () => {
    const { token } = await registerUser();
    const other = await registerUser();
    await createTask(other.token, { title: "Not mine" });

    await createTask(token, { title: "a", status: "TODO", priority: "HIGH", dueDate: shift(-2) });
    await createTask(token, { title: "b", status: "IN_PROGRESS", dueDate: today });
    await createTask(token, { title: "c", status: "COMPLETED", dueDate: shift(-5) });
    await createTask(token, { title: "d", status: "COMPLETED" });

    const res = await api().get("/api/tasks/stats").set(bearer(token));
    expect(res.status).toBe(200);
    expect(res.body.data.stats).toEqual({
      total: 4,
      todo: 1,
      inProgress: 1,
      completed: 2,
      overdue: 1,
      dueToday: 1,
      completionRate: 50,
      byPriority: { LOW: 0, MEDIUM: 1, HIGH: 1 },
    });
  });
});
