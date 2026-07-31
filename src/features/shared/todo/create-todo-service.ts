import { authService } from "@/services/auth";
import { API_ENDPOINTS, createAuthHeaders, todoClient } from "@/services/api";
import type { TodoService } from "@/src/features/shared/todo/todo-service";

const getConfig = async () => ({
  headers: createAuthHeaders(await authService.getToken()),
});

export const createAdminTodoService = (): TodoService => ({
  canManage: true,
  async getTasks() {
    const { data } = await todoClient.get(API_ENDPOINTS.todo.admin.all, await getConfig());
    return Array.isArray(data?.tasks) ? data.tasks : [];
  },
  async createTask(input) {
    await todoClient.post(API_ENDPOINTS.todo.admin.all, input, await getConfig());
  },
  async assignTask(taskId, assignedTo) {
    await todoClient.post(API_ENDPOINTS.todo.admin.assign(taskId), { assignedTo }, await getConfig());
  },
  async updateStatus(taskId, status) {
    await todoClient.patch(API_ENDPOINTS.todo.admin.status(taskId), { status }, await getConfig());
  },
  async deleteTask(taskId) {
    await todoClient.delete(API_ENDPOINTS.todo.admin.detail(taskId), await getConfig());
  },
});

export const createUserTodoService = (): TodoService => ({
  canManage: false,
  async getTasks() {
    const { data } = await todoClient.get(API_ENDPOINTS.todo.user.mine, await getConfig());
    return Array.isArray(data?.tasks) ? data.tasks : [];
  },
  async updateStatus(taskId, status) {
    await todoClient.patch(API_ENDPOINTS.todo.user.status(taskId), { status }, await getConfig());
  },
});

