import { API_URL } from "@/constants/api";
import axios from "axios";

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: Number(process.env.EXPO_PUBLIC_API_TIMEOUT_MS) || 10000,
});

export const workscheduleClient = axios.create({
  baseURL: `${API_URL}/workschedule`,
  timeout: apiClient.defaults.timeout,
});

export const todoClient = axios.create({
  baseURL: `${API_URL}/todo`,
  timeout: apiClient.defaults.timeout,
});

export const createAuthHeaders = (token: string | null | undefined) =>
  token ? { Authorization: `Bearer ${token}` } : undefined;

export const API_ENDPOINTS = {
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    verify: "/auth/verify",
    me: "/auth/me",
  },
  user: {
    all: "/user/all",
  },
  chat: {
    all: "/chat/chat/all",
    create: "/chat/chat/new",
    message: "/chat/message",
    messages: (chatId: string) => `/chat/message/${chatId}`,
  },
  todo: {
    all: "/",
    mine: "/my-tasks",
    assign: (taskId: string) => `/${taskId}/assign`,
    status: (taskId: string) => `/${taskId}/status`,
    detail: (taskId: string) => `/${taskId}`,
  },
  workschedule: {
    policy: "/policy",
    mySchedules: "/schedule/my",
    requests: "/schedule/requests",
    request: (id: string) => `/schedule/requests/${id}`,
    submitRequest: (id: string) => `/schedule/requests/${id}/submit`,
    attendanceScan: "/workschedule/attendance/scan",
    admin: {
      policy: "/admin/policy",
      pendingSchedules: "/admin/schedule/pending",
      allSchedules: "/admin/schedule/all",
      approve: (id: string) => `/admin/schedule/${id}/approve`,
      reject: (id: string) => `/admin/schedule/${id}/reject`,
      bulkApprove: "/admin/schedule/bulk-approve",
      heatmap: "/admin/schedule/heatmap",
      generateQr: "/admin/attendance/qr/generate",
      todayAttendance: "/admin/attendance/today",
      attendanceReport: "/admin/attendance/report",
    },
  },
} as const;
