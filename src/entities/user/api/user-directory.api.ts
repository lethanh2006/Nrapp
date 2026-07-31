import { apiClient } from "@/src/api/client";
import { API_ENDPOINTS } from "@/src/api/endpoints";
import type { UserDirectory } from "@/src/entities/user/api/user-directory.types";
import type { User } from "@/src/entities/user/model/user.types";

export const userDirectory: UserDirectory = {
  getAll: () =>
    apiClient.get<{ users: User[] }>(API_ENDPOINTS.user.all),
};

// Backend hiện dùng cùng contract cho cả hai khu vực.
export const adminUserDirectory = userDirectory;
