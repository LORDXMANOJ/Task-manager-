import type { ApiSuccess, AuthResponse, User } from "../types";
import type { LoginValues, RegisterValues } from "../utils/validation";
import { api } from "./api";

export const authService = {
  async register(values: RegisterValues): Promise<AuthResponse> {
    const { data } = await api.post<ApiSuccess<AuthResponse>>("/auth/register", values);
    return data.data;
  },

  async login(values: LoginValues): Promise<AuthResponse> {
    const { data } = await api.post<ApiSuccess<AuthResponse>>("/auth/login", values);
    return data.data;
  },

  async logout(): Promise<void> {
    await api.post("/auth/logout");
  },

  async me(): Promise<User> {
    const { data } = await api.get<ApiSuccess<{ user: User }>>("/auth/me");
    return data.data.user;
  },

  async forgotPassword(email: string): Promise<{ message: string; devResetUrl?: string }> {
    const { data } = await api.post<ApiSuccess<{ devResetUrl?: string }>>("/auth/forgot-password", { email });
    return { message: data.message ?? "Check your inbox for a reset link.", devResetUrl: data.data?.devResetUrl };
  },

  async resetPassword(token: string, password: string, confirmPassword: string): Promise<string> {
    const { data } = await api.post<ApiSuccess<null>>("/auth/reset-password", { token, password, confirmPassword });
    return data.message ?? "Password reset.";
  },
};
