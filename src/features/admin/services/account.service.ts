import { API_ENDPOINTS, apiClient } from "@/services/api";
import type { MessageResponse, User, UserRole } from "@/types/api";

type UserResponse = { user: User };

export const adminAccountService = {
  getProfile: (userId: string) =>
    apiClient.get<UserResponse>(API_ENDPOINTS.admin.users.detail(userId)),
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

