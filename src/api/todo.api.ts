import { apiClient } from "@/src/api/client";
import type {
  TaskItem,
  TaskPriority,
  TaskStatus,
} from "@/src/features/todo/model/todo.types";

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority: TaskPriority;
  deadline?: string;
  assignedTo?: string;
}

export interface TodoApi {
  readonly canManage: boolean;
  getTasks(): Promise<TaskItem[]>;
  createTask?(input: CreateTaskInput): Promise<void>;
  assignTask?(taskId: string, assignedTo: string): Promise<void>;
  updateStatus(taskId: string, status: TaskStatus): Promise<void>;
  deleteTask?(taskId: string): Promise<void>;
}

export const adminTodoApi: TodoApi = {
  canManage: true,

  async getTasks() {
    const { data } = await apiClient.get("/todo/");
    return Array.isArray(data?.tasks) ? data.tasks : [];
  },

  async createTask(input) {
    await apiClient.post("/todo/", input);
  },

  async assignTask(taskId, assignedTo) {
    await apiClient.patch(`/todo/${encodeURIComponent(taskId)}/assign`, {
      assignedTo,
    });
  },

  async updateStatus(taskId, status) {
    await apiClient.patch(`/todo/${encodeURIComponent(taskId)}/status`, {
      status,
    });
  },

  async deleteTask(taskId) {
    await apiClient.delete(`/todo/${encodeURIComponent(taskId)}`);
  },
};

export const userTodoApi: TodoApi = {
  canManage: false,

  async getTasks() {
    const { data } = await apiClient.get("/todo/my-tasks");
    return Array.isArray(data?.tasks) ? data.tasks : [];
  },

  async updateStatus(taskId, status) {
    await apiClient.patch(`/todo/${encodeURIComponent(taskId)}/status`, {
      status,
    });
  },
};
