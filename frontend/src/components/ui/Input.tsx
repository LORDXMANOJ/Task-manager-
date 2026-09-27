import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "../../utils/cn";
import { controlClass, FormField } from "./FormField";

interface BaseProps {
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  labelAction?: ReactNode;
  containerClassName?: string;
}

const describedBy = (id: string, error?: string, hint?: string) =>
  error ? `${id}-error` : hint ? `${id}-hint` : undefined;

type InputProps = BaseProps & InputHTMLAttributes<HTMLInputElement> & { id: string };

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { id, label, error, hint, optional, labelAction, containerClassName, className, ...props },
  ref,
) {
  return (
    <FormField id={id} label={label} error={error} hint={hint} optional={optional} action={labelAction} className={containerClassName}>
      <input
        ref={ref}
        id={id}
        aria-invalid={!!error || undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn(controlClass(!!error), "h-10", className)}
        {...props}
      />
    </FormField>
  );
});

export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputProps, "type">>(function PasswordInput(
  { id, label, error, hint, optional, labelAction, containerClassName, className, ...props },
  ref,
) {
  const [visible, setVisible] = useState(false);
  return (
    <FormField id={id} label={label} error={error} hint={hint} optional={optional} action={labelAction} className={containerClassName}>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy(id, error, hint)}
          className={cn(controlClass(!!error), "h-10 pr-10", className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </FormField>
  );
});

type TextareaProps = BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement> & { id: string };

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { id, label, error, hint, optional, labelAction, containerClassName, className, ...props },
  ref,
) {
  return (
    <FormField id={id} label={label} error={error} hint={hint} optional={optional} action={labelAction} className={containerClassName}>
      <textarea
        ref={ref}
        id={id}
        aria-invalid={!!error || undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn(controlClass(!!error), "min-h-24 resize-y py-2.5", className)}
        {...props}
      />
    </FormField>
  );
});

type SelectProps = BaseProps &
  SelectHTMLAttributes<HTMLSelectElement> & { id: string; options: { value: string; label: string }[] };

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { id, label, error, hint, optional, labelAction, containerClassName, className, options, ...props },
  ref,
) {
  return (
    <FormField id={id} label={label} error={error} hint={hint} optional={optional} action={labelAction} className={containerClassName}>
      <select
        ref={ref}
        id={id}
        aria-invalid={!!error || undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn(controlClass(!!error), "h-10 cursor-pointer pr-8", className)}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
});
