export type KnownAppRole = "admin" | "manager" | "chef" | "user";
export type AppRole = KnownAppRole | (string & {});
