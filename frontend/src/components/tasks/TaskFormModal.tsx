import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useCreateTask, useUpdateTask } from "../../hooks/useTasks";
import type { Task, TaskInput } from "../../types";
import { getErrorMessage, getFieldErrors } from "../../utils/errors";
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from "../../utils/task";
import { taskSchema, type TaskFormValues } from "../../utils/validation";
import { Alert } from "../ui/Alert";
import { Button } from "../ui/Button";
import { Input, Select, Textarea } from "../ui/Input";
import { Modal } from "../ui/Modal";

interface TaskFormModalProps {
  open: boolean;
  task: Task | null; // null = create
  onClose: () => void;
}

const EMPTY: TaskFormValues = { title: "", description: "", status: "TODO", priority: "MEDIUM", dueDate: "" };

const toFormValues = (task: Task | null): TaskFormValues =>
  task
    ? {
        title: task.title,
        description: task.description ?? "",
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ?? "",
      }
    : EMPTY;

export function TaskFormModal({ open, task, onClose }: TaskFormModalProps) {
  const isEdit = !!task;
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors },
  } = useForm<TaskFormValues>({ resolver: zodResolver(taskSchema), defaultValues: toFormValues(task) });

  useEffect(() => {
    if (open) {
      reset(toFormValues(task));
      setFormError(null);
    }
  }, [open, task, reset]);

  const saving = createTask.isPending || updateTask.isPending;
  const descriptionLength = watch("description")?.length ?? 0;

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const input: TaskInput = {
      title: values.title.trim(),
      description: values.description.trim() || null,
      status: values.status,
      priority: values.priority,
      dueDate: values.dueDate || null,
    };
    try {
      if (task) await updateTask.mutateAsync({ id: task.id, input });
      else await createTask.mutateAsync(input);
      onClose();
    } catch (error) {
      const fields = getFieldErrors(error);
      let mapped = false;
      for (const [field, message] of Object.entries(fields)) {
        if (field in EMPTY) {
          setError(field as keyof TaskFormValues, { message });
          mapped = true;
        }
      }
      if (!mapped) setFormError(getErrorMessage(error, "Couldn't save the task"));
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      dismissible={!saving}
      title={isEdit ? "Edit task" : "Create task"}
      description={isEdit ? "Update the details of your task." : "Add a new task to your list."}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="task-form" loading={saving}>
            {saving ? (isEdit ? "Updating task..." : "Creating task...") : "Save task"}
          </Button>
        </>
      }
    >
      <form id="task-form" onSubmit={onSubmit} noValidate className="space-y-4">
        {formError && <Alert>{formError}</Alert>}

        <Input
          id="task-title"
          label="Task title"
          placeholder="e.g. Complete internship project"
          maxLength={200}
          autoComplete="off"
          error={errors.title?.message}
          {...register("title")}
        />

        <Textarea
          id="task-description"
          label="Description"
          optional
          rows={4}
          maxLength={2000}
          placeholder="Add more details..."
          error={errors.description?.message}
          hint={descriptionLength > 1500 ? `${descriptionLength}/2000 characters` : undefined}
          {...register("description")}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Select id="task-priority" label="Priority" options={PRIORITY_OPTIONS} error={errors.priority?.message} {...register("priority")} />
          <Select id="task-status" label="Status" options={STATUS_OPTIONS} error={errors.status?.message} {...register("status")} />
          <Input id="task-due" type="date" label="Due date" optional min="2000-01-01" max="2100-12-31" error={errors.dueDate?.message} {...register("dueDate")} />
        </div>
      </form>
    </Modal>
  );
}
