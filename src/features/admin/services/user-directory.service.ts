import { API_ENDPOINTS, apiClient } from "@/services/api";
import type { UserDirectory } from "@/src/features/shared/users/user-directory";
import type { User } from "@/types/api";

export const adminUserDirectory: UserDirectory = {
  getAll: () =>
    apiClient.get<{ users: User[] }>(API_ENDPOINTS.admin.users.all),
};

