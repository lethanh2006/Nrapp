import { apiClient } from "@/src/shared/api/http-client";
import type { UserDirectory } from "@/src/entities/user/api/user-directory.types";
import type { User } from "@/src/entities/user/model/user.types";

export const adminUserDirectory: UserDirectory = {
  getAll: () =>
    apiClient.get<{ users: User[] }>("/user/user/all"),
};
