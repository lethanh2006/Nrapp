import Constants from "expo-constants";
import { Platform } from "react-native";

const API_PORT = process.env.EXPO_PUBLIC_API_PORT || "3000";
const API_PATH = process.env.EXPO_PUBLIC_API_PATH || "/api";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const getExpoHost = () => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.debuggerHost ||
    Constants.manifest2?.extra?.expoClient?.hostUri;

  return typeof hostUri === "string" ? hostUri.split(":")[0] : undefined;
};

const getDevelopmentOrigin = () => {
  const expoHost = getExpoHost();
  if (expoHost) return `http://${expoHost}:${API_PORT}`;
  if (Platform.OS === "android") return `http://10.0.2.2:${API_PORT}`;
  return `http://localhost:${API_PORT}`;
};

const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

if (!configuredUrl && !__DEV__) {
  throw new Error("EXPO_PUBLIC_API_URL must be configured for production builds");
}

export const API_URL = trimTrailingSlash(
  configuredUrl || `${getDevelopmentOrigin()}${API_PATH}`,
);

export const SOCKET_URL =
  process.env.EXPO_PUBLIC_SOCKET_URL?.trim().replace(/\/+$/, "") ||
  API_URL.replace(/\/api\/?$/, "");

export const SOCKET_PATH = process.env.EXPO_PUBLIC_SOCKET_PATH || "/socket.io";
