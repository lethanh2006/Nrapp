import { apiClient } from "@/src/shared/api/http-client";
import type { User } from "@/src/entities/user/model/user.types";

type UserResponse = { user: User };

export const userService = {
  getMe: () => apiClient.get<UserResponse>("/user/me"),
};
