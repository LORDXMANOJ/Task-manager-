import type { DueFilter, SortOption, Task, TaskPriority, TaskStatus } from "../types";
import { daysUntil } from "./date";

export const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "TODO", label: "To do" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "COMPLETED", label: "Completed" },
];

export const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
];

export const DUE_OPTIONS: { value: DueFilter; label: string }[] = [
  { value: "all", label: "Any date" },
  { value: "today", label: "Due today" },
  { value: "week", label: "This week" },
  { value: "overdue", label: "Overdue" },
  { value: "none", label: "No due date" },
];

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "dueDate", label: "Due date" },
  { value: "priority", label: "Priority" },
  { value: "updated", label: "Recently updated" },
];

export const STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
};

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

/** Tailwind background class for the status dot (shared with the dashboard chart). */
export const STATUS_DOT: Record<TaskStatus, string> = {
  TODO: "bg-status-todo",
  IN_PROGRESS: "bg-status-progress",
  COMPLETED: "bg-status-done",
};

export function isOverdue(task: Pick<Task, "dueDate" | "status">): boolean {
  return !!task.dueDate && task.status !== "COMPLETED" && daysUntil(task.dueDate) < 0;
}
