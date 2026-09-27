import type { ApiSuccess, Task, TaskInput, TaskListResponse, TaskQuery, TaskStats, TaskStatus } from "../types";
import { userTimeZone } from "../utils/date";
import { api } from "./api";

function toParams(query: TaskQuery) {
  return {
    search: query.search || undefined,
    status: query.status?.length ? query.status.join(",") : undefined,
    priority: query.priority?.length ? query.priority.join(",") : undefined,
    due: query.due && query.due !== "all" ? query.due : undefined,
    sort: query.sort,
    page: query.page,
    limit: query.limit,
    tz: userTimeZone,
  };
}

export const taskService = {
  async list(query: TaskQuery): Promise<TaskListResponse> {
    const { data } = await api.get<ApiSuccess<TaskListResponse>>("/tasks", { params: toParams(query) });
    return data.data;
  },

  async stats(): Promise<TaskStats> {
    const { data } = await api.get<ApiSuccess<{ stats: TaskStats }>>("/tasks/stats", { params: { tz: userTimeZone } });
    return data.data.stats;
  },

  async get(id: string): Promise<Task> {
    const { data } = await api.get<ApiSuccess<{ task: Task }>>(`/tasks/${id}`);
    return data.data.task;
  },

  async create(input: TaskInput): Promise<Task> {
    const { data } = await api.post<ApiSuccess<{ task: Task }>>("/tasks", input);
    return data.data.task;
  },

  async update(id: string, input: TaskInput): Promise<Task> {
    const { data } = await api.put<ApiSuccess<{ task: Task }>>(`/tasks/${id}`, input);
    return data.data.task;
  },

  async updateStatus(id: string, status: TaskStatus): Promise<Task> {
    const { data } = await api.patch<ApiSuccess<{ task: Task }>>(`/tasks/${id}/status`, { status });
    return data.data.task;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/tasks/${id}`);
  },
};
