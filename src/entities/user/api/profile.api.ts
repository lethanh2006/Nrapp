import { apiClient } from "@/src/api/client";
import { API_ENDPOINTS } from "@/src/api/endpoints";
import type { User } from "@/src/entities/user/model/user.types";

type UserResponse = { user: User };

export const userService = {
  getMe: () => apiClient.get<UserResponse>(API_ENDPOINTS.user.profile),
};
