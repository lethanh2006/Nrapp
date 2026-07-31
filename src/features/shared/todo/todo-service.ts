import type { TaskItem, TaskPriority, TaskStatus } from "@/components/todo/types";

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority: TaskPriority;
  deadline?: string;
  assignedTo?: string;
}

export interface TodoService {
  readonly canManage: boolean;
  getTasks(): Promise<TaskItem[]>;
  createTask?(input: CreateTaskInput): Promise<void>;
  assignTask?(taskId: string, assignedTo: string): Promise<void>;
  updateStatus(taskId: string, status: TaskStatus): Promise<void>;
  deleteTask?(taskId: string): Promise<void>;
}

