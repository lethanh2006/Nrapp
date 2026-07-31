import { API_ENDPOINTS, apiClient } from "@/services/api";
import type { MessageResponse, User } from "@/types/api";

type UserResponse = { user: User };

export const userService = {
  getMe: () => apiClient.get<UserResponse>(API_ENDPOINTS.profile.me),
  getPublicProfile: (userId: string) =>
    apiClient.get<UserResponse>(API_ENDPOINTS.profile.detail(userId)),
  updateUsername: (username: string) =>
    apiClient.post<MessageResponse & UserResponse>(API_ENDPOINTS.profile.update, {
      username,
    }),
};
