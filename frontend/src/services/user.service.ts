import type { ApiSuccess, User } from "../types";
import { api } from "./api";

export const userService = {
  async updateProfile(name: string): Promise<User> {
    const { data } = await api.patch<ApiSuccess<{ user: User }>>("/users/me", { name });
    return data.data.user;
  },

  /** Returns a fresh token: the server signs out every other session. */
  async changePassword(currentPassword: string, newPassword: string, confirmPassword: string): Promise<string> {
    const { data } = await api.patch<ApiSuccess<{ token: string }>>("/users/me/password", {
      currentPassword,
      newPassword,
      confirmPassword,
    });
    return data.data.token;
  },

  async deleteAccount(password: string): Promise<void> {
    await api.delete("/users/me", { data: { password } });
  },
};
