import { API_ENDPOINTS, apiClient } from "@/services/api";
import type { UserDirectory } from "@/src/features/shared/users/user-directory";
import type { User } from "@/types/api";

// Endpoint hiện tại dùng chung; instance riêng giúp đổi contract user mà không ảnh hưởng admin.
export const userDirectory: UserDirectory = {
  getAll: () =>
    apiClient.get<{ users: User[] }>(API_ENDPOINTS.admin.users.all),
};

