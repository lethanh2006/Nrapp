import { API_ENDPOINTS, apiClient } from "@/services/api";
import type { MessageResponse, User, UserRole } from "@/types/api";

type UserResponse = { user: User };

export const userService = {
  getMe: () => apiClient.get<UserResponse>(API_ENDPOINTS.user.me),
  getAll: () =>
    apiClient.get<{ users: User[] }>(API_ENDPOINTS.user.all),
  getPublicProfile: (userId: string) =>
    apiClient.get<UserResponse>(API_ENDPOINTS.user.detail(userId)),
  updateUsername: (username: string) =>
    apiClient.post<MessageResponse & UserResponse>(API_ENDPOINTS.user.update, {
      username,
    }),
  getAdminProfile: (userId: string) =>
    apiClient.get<UserResponse>(API_ENDPOINTS.user.adminDetail(userId)),
  getAuthProfile: (userId: string) =>
    apiClient.get<User>(API_ENDPOINTS.auth.user(userId)),
  updateRole: (userId: string, role: UserRole) =>
    apiClient.patch<MessageResponse & { userId: string; role: UserRole }>(
      API_ENDPOINTS.auth.role(userId),
      { role },
    ),
  deleteUser: (userId: string) =>
    apiClient.delete<MessageResponse>(API_ENDPOINTS.auth.user(userId)),
};
