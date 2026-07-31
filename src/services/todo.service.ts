import axios from "@/src/utils/axios";
import { getAuthHeader } from "@/src/utils/apiHelper";
import { ipNR } from "@/src/utils/ip";
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

export async function getAdminTasks(token: string) {
  const { data } = await axios.get<{ tasks: TaskItem[] }>(
    `${ipNR}/todo/`,
    getAuthHeader(token),
  );
  return Array.isArray(data.tasks) ? data.tasks : [];
}

export async function getMyTasks(token: string) {
  const { data } = await axios.get<{ tasks: TaskItem[] }>(
    `${ipNR}/todo/my-tasks`,
    getAuthHeader(token),
  );
  return Array.isArray(data.tasks) ? data.tasks : [];
}

export async function createTodoTask(token: string, input: CreateTaskInput) {
  return axios.post(`${ipNR}/todo/`, input, getAuthHeader(token));
}

export async function assignTodoTask(
  token: string,
  taskId: string,
  assignedTo: string,
) {
  return axios.patch(
    `${ipNR}/todo/${encodeURIComponent(taskId)}/assign`,
    { assignedTo },
    getAuthHeader(token),
  );
}

export async function updateTodoStatus(
  token: string,
  taskId: string,
  status: TaskStatus,
) {
  return axios.patch(
    `${ipNR}/todo/${encodeURIComponent(taskId)}/status`,
    { status },
    getAuthHeader(token),
  );
}

export async function deleteTodoTask(token: string, taskId: string) {
  return axios.delete(
    `${ipNR}/todo/${encodeURIComponent(taskId)}`,
    getAuthHeader(token),
  );
}
