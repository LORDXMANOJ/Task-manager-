export type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";
export type DueFilter = "all" | "today" | "week" | "overdue" | "none";
export type SortOption = "newest" | "oldest" | "dueDate" | "priority" | "updated";

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  /** "YYYY-MM-DD" */
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskInput {
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TaskListResponse {
  tasks: Task[];
  pagination: Pagination;
}

export interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  completed: number;
  overdue: number;
  dueToday: number;
  completionRate: number;
  byPriority: Record<TaskPriority, number>;
}

export interface TaskQuery {
  search?: string;
  status?: TaskStatus[];
  priority?: TaskPriority[];
  due?: DueFilter;
  sort?: SortOption;
  page?: number;
  limit?: number;
}

/** Every API response uses this envelope. */
export interface ApiSuccess<T> {
  success: true;
  message?: string;
  data: T;
}

export interface ApiFailure {
  success: false;
  message: string;
  errors?: Record<string, string>;
}

export interface AuthResponse {
  user: User;
  token: string;
}
