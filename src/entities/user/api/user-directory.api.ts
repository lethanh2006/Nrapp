import { apiClient } from "@/src/shared/api/http-client";
import type { UserDirectory } from "@/src/entities/user/api/user-directory.types";
import type { User } from "@/src/entities/user/model/user.types";

// Endpoint hiện tại dùng chung; instance riêng giúp đổi contract user mà không ảnh hưởng admin.
export const userDirectory: UserDirectory = {
  getAll: () =>
    apiClient.get<{ users: User[] }>("/user/user/all"),
};
