import type { User } from "@/src/features/user/model/user.types";
import type { AxiosResponse } from "axios";

export interface UserDirectory {
  getAll(): Promise<AxiosResponse<{ users: User[] }>>;
}
