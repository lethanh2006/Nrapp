import { API_ENDPOINTS, apiClient } from "@/services/api";
import type { User } from "@/types/api";

type UserResponse = { user: User };

export const userService = {
  getMe: () => apiClient.get<UserResponse>(API_ENDPOINTS.profile.me),
};
