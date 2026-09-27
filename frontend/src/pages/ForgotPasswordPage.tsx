import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, MailCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { AuthLayout } from "../layouts/AuthLayout";
import { authService } from "../services/auth.service";
import { getErrorMessage } from "../utils/errors";
import { forgotPasswordSchema, type ForgotPasswordValues } from "../utils/validation";

export function ForgotPasswordPage() {
  const [sent, setSent] = useState<{ message: string; devResetUrl?: string } | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: "" } });

  const onSubmit = handleSubmit(async ({ email }) => {
    setServerError(null);
    try {
      setSent(await authService.forgotPassword(email));
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  });

  const backToLogin = (
    <Link to="/login" className="inline-flex items-center gap-1.5 font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
      <ArrowLeft className="h-4 w-4" aria-hidden />
      Back to log in
    </Link>
  );

  if (sent) {
    return (
      <AuthLayout title="Check your email" subtitle={sent.message} footer={backToLogin}>
        <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <MailCheck className="h-6 w-6" aria-hidden />
          </span>
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">The link expires in 30 minutes. Didn&apos;t get it? Check spam or try again.</p>
          <Button variant="outline" className="mt-4" onClick={() => setSent(null)}>
            Try another email
          </Button>
        </div>
        {sent.devResetUrl && (
          <Alert variant="info" className="mt-4">
            <strong>Development mode:</strong> no email provider is configured, so here is your reset link:{" "}
            <a href={sent.devResetUrl} className="font-medium underline">
              Reset password
            </a>
          </Alert>
        )}
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a link to reset it."
      footer={backToLogin}
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {serverError && <Alert>{serverError}</Alert>}
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
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          {isSubmitting ? "Sending link..." : "Send reset link"}
        </Button>
      </form>
    </AuthLayout>
  );
}
