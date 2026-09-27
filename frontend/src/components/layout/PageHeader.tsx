import { Plus } from "lucide-react";
import type { ReactNode } from "react";
import { useTaskModal } from "../../context/TaskModalContext";
import { Button } from "../ui/Button";

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  showCreate?: boolean;
}

export function PageHeader({ title, description, showCreate = true }: PageHeaderProps) {
  const { openCreate } = useTaskModal();
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-semibold tracking-tight text-zinc-900 sm:text-[28px] dark:text-zinc-50">{title}</h1>
        {description && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>}
      </div>
      {showCreate && (
        <div className="hidden md:block">
          <Button onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>
            Create Task
          </Button>
        </div>
      )}
    </div>
  );
}
