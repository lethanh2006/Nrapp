import type { AppRole } from "@/src/core/auth/roles";

export type UserRole = AppRole;

export interface User {
  _id: string;
  name: string;
  username?: string;
  email: string;
  role: UserRole;
}

export interface AuthSessionResponse {
  message: string;
  token: string;
  user: User;
}

export interface MessageResponse {
  message: string;
}
