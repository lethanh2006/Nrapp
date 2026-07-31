import type { User } from "@/types/api";
import type { AxiosResponse } from "axios";

export interface UserDirectory {
  getAll(): Promise<AxiosResponse<{ users: User[] }>>;
}

