import { apiClient } from "@/src/api/client";
import type { User } from "@/src/features/user/model/user.types";

export const userApi = {
  getProfile: () => apiClient.get<{ user: User }>("/user/me"),

  getAll: () => apiClient.get<{ users: User[] }>("/user/user/all"),
};

export type UserDirectory = typeof userApi;
