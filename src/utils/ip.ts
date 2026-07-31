import Constants from "expo-constants";
import { Platform } from "react-native";

const apiPort = process.env.EXPO_PUBLIC_API_PORT || "3000";
const apiPath = process.env.EXPO_PUBLIC_API_PATH || "/api";

function removeTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function getExpoHost() {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.debuggerHost ||
    Constants.manifest2?.extra?.expoClient?.hostUri;

  return typeof hostUri === "string" ? hostUri.split(":")[0] : undefined;
}

function getDevelopmentUrl() {
  const expoHost = getExpoHost();
  if (expoHost) return `http://${expoHost}:${apiPort}${apiPath}`;
  if (Platform.OS === "android") return `http://10.0.2.2:${apiPort}${apiPath}`;
  return `http://localhost:${apiPort}${apiPath}`;
}

const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

if (!configuredUrl && !__DEV__) {
  throw new Error("EXPO_PUBLIC_API_URL must be configured for production builds");
}

export const ipNR = removeTrailingSlash(configuredUrl || getDevelopmentUrl());

export const socketUrl =
  process.env.EXPO_PUBLIC_SOCKET_URL?.trim().replace(/\/+$/, "") ||
  ipNR.replace(/\/api\/?$/, "");

export const socketPath =
  process.env.EXPO_PUBLIC_SOCKET_PATH || "/socket.io";
