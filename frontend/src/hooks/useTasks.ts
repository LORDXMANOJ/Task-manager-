import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { taskService } from "../services/task.service";
import type { Task, TaskInput, TaskListResponse, TaskQuery, TaskStatus } from "../types";
import { getErrorMessage } from "../utils/errors";

export const taskKeys = {
  all: ["tasks"] as const,
  list: (query: TaskQuery) => ["tasks", "list", query] as const,
  stats: ["tasks", "stats"] as const,
};

/** Refetch every task list and the stats after any change. */
export function invalidateTasks(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: taskKeys.all });
}

export function useTaskList(query: TaskQuery) {
  return useQuery({
    queryKey: taskKeys.list(query),
    queryFn: () => taskService.list(query),
    placeholderData: keepPreviousData, // keep showing results while a new filter loads
  });
}

export function useTaskStats() {
  return useQuery({ queryKey: taskKeys.stats, queryFn: taskService.stats });
}

type ListSnapshot = Array<[readonly unknown[], TaskListResponse | undefined]>;

/** Applies a change to every cached list so the UI responds instantly. Returns a snapshot for rollback. */
async function patchCachedLists(
  queryClient: QueryClient,
  update: (tasks: Task[]) => Task[],
): Promise<ListSnapshot> {
  await queryClient.cancelQueries({ queryKey: ["tasks", "list"] });
  const snapshot = queryClient.getQueriesData<TaskListResponse>({ queryKey: ["tasks", "list"] });
  queryClient.setQueriesData<TaskListResponse>({ queryKey: ["tasks", "list"] }, (old) =>
    old ? { ...old, tasks: update(old.tasks) } : old,
  );
  return snapshot;
}

function restore(queryClient: QueryClient, snapshot?: ListSnapshot) {
  snapshot?.forEach(([key, data]) => queryClient.setQueryData(key, data));
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TaskInput) => taskService.create(input),
    onSuccess: () => {
      toast.success("Task created");
      return invalidateTasks(queryClient);
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TaskInput }) => taskService.update(id, input),
    onSuccess: () => {
      toast.success("Task updated");
      return invalidateTasks(queryClient);
    },
  });
}

/** Status change with optimistic update (checkbox / complete button). */
export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) => taskService.updateStatus(id, status),
    onMutate: async ({ id, status }) => ({
      snapshot: await patchCachedLists(queryClient, (tasks) =>
        tasks.map((t) => (t.id === id ? { ...t, status } : t)),
      ),
    }),
    onError: (error, _vars, context) => {
      restore(queryClient, context?.snapshot);
      toast.error(getErrorMessage(error, "Couldn't update the task"));
    },
    onSuccess: (task) => {
      toast.success(task.status === "COMPLETED" ? "Task completed" : `Moved to ${task.status === "TODO" ? "To do" : "In progress"}`);
    },
    onSettled: () => invalidateTasks(queryClient),
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => taskService.remove(id),
    onMutate: async (id) => ({
      snapshot: await patchCachedLists(queryClient, (tasks) => tasks.filter((t) => t.id !== id)),
    }),
    onError: (error, _id, context) => {
      restore(queryClient, context?.snapshot);
      toast.error(getErrorMessage(error, "Couldn't delete the task"));
    },
    onSuccess: () => toast.success("Task deleted"),
    onSettled: () => invalidateTasks(queryClient),
  });
}
