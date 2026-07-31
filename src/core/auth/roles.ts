export const USER_ROLE = "user" as const;

export const ADMIN_ROLES = ["admin", "manager", "chef"] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];
export type UserRole = typeof USER_ROLE;
export type AppRole = AdminRole | UserRole | (string & {});
export type AppArea = "admin" | "user";

export const isAdminRole = (role?: AppRole | null): role is AdminRole =>
  ADMIN_ROLES.some((adminRole) => adminRole === role);

export const getAreaForRole = (role?: AppRole | null): AppArea =>
  isAdminRole(role) ? "admin" : "user";

export const canAccessArea = (
  role: AppRole | null | undefined,
  area: AppArea,
) => getAreaForRole(role) === area;

