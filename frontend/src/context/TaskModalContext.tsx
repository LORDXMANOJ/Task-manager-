import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { TaskFormModal } from "../components/tasks/TaskFormModal";
import type { Task } from "../types";

interface TaskModalContextValue {
  openCreate: () => void;
  openEdit: (task: Task) => void;
}

const TaskModalContext = createContext<TaskModalContextValue | null>(null);

/** One shared create/edit modal, reachable from the header, cards and mobile nav. */
export function TaskModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ open: boolean; task: Task | null }>({ open: false, task: null });

  const openCreate = useCallback(() => setState({ open: true, task: null }), []);
  const openEdit = useCallback((task: Task) => setState({ open: true, task }), []);
  const close = useCallback(() => setState((s) => ({ ...s, open: false })), []);

  const value = useMemo(() => ({ openCreate, openEdit }), [openCreate, openEdit]);

  return (
    <TaskModalContext.Provider value={value}>
      {children}
      <TaskFormModal open={state.open} task={state.task} onClose={close} />
    </TaskModalContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTaskModal(): TaskModalContextValue {
  const ctx = useContext(TaskModalContext);
  if (!ctx) throw new Error("useTaskModal must be used within TaskModalProvider");
  return ctx;
}
