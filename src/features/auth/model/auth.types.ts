import type { User } from "@/src/entities/user/model/user.types";

export interface AuthSessionResponse {
  message: string;
  token: string;
  user: User;
}
