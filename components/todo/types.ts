export type TaskStatus = "todo" | "in_progress" | "done" | "cancelled";
export type TaskPriority = "low" | "medium" | "high";

export type RelatedUser = {
  _id: string;
  username?: string;
  name?: string;
  email?: string;
};

export type TaskItem = {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdBy?: string | RelatedUser;
  assignedTo?: string | RelatedUser;
  deadline?: string;
  createdAt?: string;
};

export const STATUS_OPTIONS: TaskStatus[] = [
  "todo",
  "in_progress",
  "done",
  "cancelled",
];

export const PRIORITY_OPTIONS: TaskPriority[] = ["low", "medium", "high"];
