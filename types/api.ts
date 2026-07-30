export type UserRole = "admin" | "manager" | "user";

export interface User {
  _id: string;
  username: string;
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
