import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { PasswordInput } from "../components/ui/Input";
import { AuthLayout } from "../layouts/AuthLayout";
import { authService } from "../services/auth.service";
import { getErrorMessage } from "../utils/errors";
import { resetPasswordSchema, type ResetPasswordValues } from "../utils/validation";

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit(async ({ password, confirmPassword }) => {
    setServerError(null);
    try {
      const message = await authService.resetPassword(token, password, confirmPassword);
      toast.success(message);
      navigate("/login", { replace: true });
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  });

  const footer = (
    <Link to="/login" className="inline-flex items-center gap-1.5 font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
      <ArrowLeft className="h-4 w-4" aria-hidden />
      Back to log in
    </Link>
  );

  if (!token) {
    return (
      <AuthLayout title="Invalid reset link" subtitle="This password reset link is missing or incomplete." footer={footer}>
        <Button className="w-full" size="lg" onClick={() => navigate("/forgot-password")}>
          Request a new link
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set a new password" subtitle="Choose a strong password you haven't used before." footer={footer}>
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {serverError && (
          <Alert>
            {serverError}{" "}
            <Link to="/forgot-password" className="font-medium underline">
              Request a new link
            </Link>
          </Alert>
        )}
        <PasswordInput
          id="password"
          label="New password"
          autoComplete="new-password"
          hint="At least 8 characters, with a letter and a number."
          error={errors.password?.message}
          {...register("password")}
        />
        <PasswordInput
          id="confirmPassword"
          label="Confirm new password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          {isSubmitting ? "Resetting password..." : "Reset password"}
        </Button>
      </form>
    </AuthLayout>
  );
}
