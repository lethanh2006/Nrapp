import { API_URL } from "@/src/shared/config/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
  isAxiosError,
} from "axios";

export const TOKEN_KEY = "auth.accessToken";
const LEGACY_TOKEN_KEY = "token";
const REQUEST_TIMEOUT_MS =
  Number(process.env.EXPO_PUBLIC_API_TIMEOUT_MS) || 10_000;

const attachAccessToken = async (config: InternalAxiosRequestConfig) => {
  const token =
    (await AsyncStorage.getItem(TOKEN_KEY)) ||
    (await AsyncStorage.getItem(LEGACY_TOKEN_KEY));

  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
};

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { Accept: "application/json" },
});

apiClient.interceptors.request.use(attachAccessToken);

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(error),
);

const createFeatureClient = (feature: string) => {
  const client = axios.create({
    baseURL: `${API_URL}/${feature}`,
    timeout: REQUEST_TIMEOUT_MS,
    headers: { Accept: "application/json" },
  });
  client.interceptors.request.use(attachAccessToken);
  return client;
};

export const workscheduleClient = createFeatureClient("workschedule");
export const todoClient = createFeatureClient("todo");

export const createAuthHeaders = (token: string | null | undefined) =>
  token ? { Authorization: `Bearer ${token}` } : undefined;

export const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (!isAxiosError(error)) return fallback;
  const data = (error as AxiosError<{ message?: string | string[] }>).response
    ?.data;
  const message = data?.message;
  return Array.isArray(message) ? message.join("\n") : message || fallback;
};
