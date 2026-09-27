import { zodResolver } from "@hookform/resolvers/zod";
import { Check, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { Input, PasswordInput } from "../components/ui/Input";
import { useAuth } from "../context/AuthContext";
import { AuthLayout } from "../layouts/AuthLayout";
import { cn } from "../utils/cn";
import { getErrorMessage, getFieldErrors } from "../utils/errors";
import { registerSchema, type RegisterValues } from "../utils/validation";

function PasswordChecklist({ password }: { password: string }) {
  const rules = [
    { ok: password.length >= 8, label: "At least 8 characters" },
    { ok: /[A-Za-z]/.test(password), label: "One letter" },
    { ok: /\d/.test(password), label: "One number" },
  ];
  return (
    <ul className="mt-2 grid grid-cols-1 gap-1 text-xs sm:grid-cols-3" aria-label="Password requirements">
      {rules.map((rule) => (
        <li
          key={rule.label}
          className={cn("flex items-center gap-1", rule.ok ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500 dark:text-zinc-400")}
        >
          {rule.ok ? <Check className="h-3 w-3" aria-hidden /> : <X className="h-3 w-3" aria-hidden />}
          {rule.label}
          <span className="sr-only">{rule.ok ? "(met)" : "(not met)"}</span>
        </li>
      ))}
    </ul>
  );
}

export function RegisterPage() {
  const { register: registerAccount } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const password = watch("password");

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await registerAccount(values);
      toast.success("Account created. Welcome to TaskFlow!");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      const fields = getFieldErrors(error);
      const known = ["name", "email", "password", "confirmPassword"] as const;
      let mapped = false;
      for (const key of known) {
        if (fields[key]) {
          setError(key, { message: fields[key] });
          mapped = true;
        }
      }
      if (!mapped) setServerError(getErrorMessage(error, "Couldn't create your account. Please try again."));
    }
  });

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start organising your work in less than a minute."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {serverError && <Alert>{serverError}</Alert>}
        <Input id="name" label="Full name" placeholder="Jane Doe" autoComplete="name" error={errors.name?.message} {...register("name")} />
        <Input
          id="email"
          type="email"
          label="Email"
          placeholder="you@example.com"
          autoComplete="email"
          inputMode="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <div>
          <PasswordInput
            id="password"
            label="Password"
            placeholder="Create a password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password")}
          />
          {password && !errors.password && <PasswordChecklist password={password} />}
        </div>
        <PasswordInput
          id="confirmPassword"
          label="Confirm password"
          placeholder="Repeat your password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Create account"}
        </Button>
      </form>
    </AuthLayout>
  );
}
