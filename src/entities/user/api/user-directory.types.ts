import type { User } from "@/src/entities/user/model/user.types";
import type { AxiosResponse } from "axios";

export interface UserDirectory {
  getAll(): Promise<AxiosResponse<{ users: User[] }>>;
}
