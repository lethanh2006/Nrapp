import { authService } from "@/src/features/auth/api/auth.api";
import { createAuthHeaders, todoClient } from "@/src/shared/api/http-client";
import type { TodoApi } from "@/src/features/todo/api/todo-api.types";

const getConfig = async () => ({
  headers: createAuthHeaders(await authService.getToken()),
});

const TODO_ENDPOINTS = {
  admin: {
    all: "/",
    assign: (taskId: string) => `/${encodeURIComponent(taskId)}/assign`,
    status: (taskId: string) => `/${encodeURIComponent(taskId)}/status`,
    detail: (taskId: string) => `/${encodeURIComponent(taskId)}`,
  },
  user: {
    mine: "/my-tasks",
    status: (taskId: string) => `/${encodeURIComponent(taskId)}/status`,
  },
} as const;

export const createAdminTodoApi = (): TodoApi => ({
  canManage: true,
  async getTasks() {
    const { data } = await todoClient.get(TODO_ENDPOINTS.admin.all, await getConfig());
    return Array.isArray(data?.tasks) ? data.tasks : [];
  },
  async createTask(input) {
    await todoClient.post(TODO_ENDPOINTS.admin.all, input, await getConfig());
  },
  async assignTask(taskId, assignedTo) {
    await todoClient.post(TODO_ENDPOINTS.admin.assign(taskId), { assignedTo }, await getConfig());
  },
  async updateStatus(taskId, status) {
    await todoClient.patch(TODO_ENDPOINTS.admin.status(taskId), { status }, await getConfig());
  },
  async deleteTask(taskId) {
    await todoClient.delete(TODO_ENDPOINTS.admin.detail(taskId), await getConfig());
  },
});

export const createUserTodoApi = (): TodoApi => ({
  canManage: false,
  async getTasks() {
    const { data } = await todoClient.get(TODO_ENDPOINTS.user.mine, await getConfig());
    return Array.isArray(data?.tasks) ? data.tasks : [];
  },
  async updateStatus(taskId, status) {
    await todoClient.patch(TODO_ENDPOINTS.user.status(taskId), { status }, await getConfig());
  },
});
