export type KnownAppRole = "admin" | "manager" | "chef" | "user";
export type AppRole = KnownAppRole | (string & {});
export type UserRole = AppRole;

export interface User {
  _id: string;
  name: string;
  username?: string;
  email: string;
  role: UserRole;
}
