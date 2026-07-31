import { API_URL } from "@/src/shared/config/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { AxiosError, isAxiosError } from "axios";

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
    if (__DEV__ && isAxiosError(error)) {
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
  if (!isAxiosError(error)) return fallback;
  const data = (error as AxiosError<{ message?: string | string[] }>).response?.data;
  const message = data?.message;
  return Array.isArray(message) ? message.join("\n") : message || fallback;
};
