import { z } from "zod";

/**
 * Client-side validation mirrors the API rules (backend/src/validators) so users
 * get instant feedback. The server still validates everything independently.
 */

const email = z.string().trim().min(1, "Email is required").pipe(z.email("Please enter a valid email address"));

const strongPassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .regex(/[A-Za-z]/, "Password must contain at least one letter")
  .regex(/\d/, "Password must contain at least one number");

const name = z.string().trim().min(2, "Name must be at least 2 characters").max(80, "Name must be at most 80 characters");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    name,
    email,
    password: strongPassword,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    password: strongPassword,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

export const profileSchema = z.object({ name });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: strongPassword,
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: "New password must be different from your current password",
    path: ["newPassword"],
  });

export const taskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title must be at most 200 characters"),
  description: z.string().trim().max(2000, "Description must be at most 2000 characters"),
  status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED"], { error: "Choose a valid status" }),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"], { error: "Choose a valid priority" }),
  dueDate: z
    .string()
    .refine((v) => v === "" || (/^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))), "Enter a valid date")
    .refine((v) => v === "" || (v >= "2000-01-01" && v <= "2100-12-31"), "Date must be between 2000 and 2100"),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
export type ProfileValues = z.infer<typeof profileSchema>;
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
export type TaskFormValues = z.infer<typeof taskSchema>;
