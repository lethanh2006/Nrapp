import type { AppRole } from "@/src/features/user/model/role.types";

export type UserRole = AppRole;

export interface User {
  _id: string;
  name: string;
  username?: string;
  email: string;
  role: UserRole;
}
