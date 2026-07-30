import { API_URL } from "@/constants/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { AxiosError } from "axios";

export const TOKEN_KEY = "auth.accessToken";
const LEGACY_TOKEN_KEY = "token";

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: Number(process.env.EXPO_PUBLIC_API_TIMEOUT_MS) || 10000,
  headers: { Accept: "application/json" },
});

apiClient.interceptors.request.use(async (config) => {
  const token =
    (await AsyncStorage.getItem(TOKEN_KEY)) ||
    (await AsyncStorage.getItem(LEGACY_TOKEN_KEY));
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (__DEV__) {
    console.log("[API][REQUEST]", {
      method: config.method?.toUpperCase(),
      url: `${config.baseURL || ""}${config.url || ""}`,
      hasToken: Boolean(token),
      contentType: config.headers["Content-Type"],
    });
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log("[API][RESPONSE]", {
        method: response.config.method?.toUpperCase(),
        url: response.config.url,
        status: response.status,
      });
    }
    return response;
  },
  (error: unknown) => {
    if (__DEV__ && axios.isAxiosError(error)) {
      console.error("[API][ERROR]", {
        method: error.config?.method?.toUpperCase(),
        url: error.config?.url,
        status: error.response?.status,
        response: error.response?.data,
        message: error.message,
      });
    }
    return Promise.reject(error);
  },
);

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

export const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (!axios.isAxiosError(error)) return fallback;
  const data = (error as AxiosError<{ message?: string | string[] }>).response?.data;
  const message = data?.message;
  return Array.isArray(message) ? message.join("\n") : message || fallback;
};

export const API_ENDPOINTS = {
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    verify: "/auth/verify",
    refresh: "/auth/refresh",
    googleLogin: "/auth/login-google",
    me: "/auth/me",
    email: "/auth/me/email",
    user: (userId: string) => `/auth/users/${encodeURIComponent(userId)}`,
    role: (userId: string) =>
      `/auth/users/${encodeURIComponent(userId)}/role`,
  },
  user: {
    me: "/user/me",
    all: "/user/user/all",
    detail: (userId: string) => `/user/${encodeURIComponent(userId)}`,
    update: "/user/update/user",
    adminDetail: (userId: string) =>
      `/user/admin/${encodeURIComponent(userId)}`,
  },
  chat: {
    all: "/chat/chat/all",
    create: "/chat/chat/new",
    message: "/chat/message",
    messages: (chatId: string) =>
      `/chat/message/${encodeURIComponent(chatId)}`,
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
