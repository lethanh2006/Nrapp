import type { User } from "@/src/features/user/model/user.types";

export interface AuthSessionResponse {
  message: string;
  token: string;
  user: User;
}
