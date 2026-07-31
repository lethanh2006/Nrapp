import { TOKEN_KEY, apiClient } from "@/src/shared/api/http-client";
import type { AuthSessionResponse } from "@/src/features/auth/model/auth.types";
import type { MessageResponse } from "@/src/shared/api/api.types";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_ENDPOINTS = {
  register: "/auth/register",
  login: "/auth/login",
  verify: "/auth/verify",
} as const;

export const authService = {
  register: (payload: { username: string; email: string; password: string }) =>
    apiClient.post<MessageResponse & { userId: string }>(
      AUTH_ENDPOINTS.register,
      payload,
    ),
  login: (payload: { email: string; password: string }) =>
    apiClient.post<MessageResponse & { email: string }>(
      AUTH_ENDPOINTS.login,
      payload,
    ),
  verify: (payload: { email: string; otp: string }) =>
    apiClient.post<AuthSessionResponse>(AUTH_ENDPOINTS.verify, payload),
  saveSession: async ({ token }: AuthSessionResponse) => {
    await AsyncStorage.multiSet([
      [TOKEN_KEY, token],
      ["token", token],
    ]);
  },
  getToken: async () =>
    (await AsyncStorage.getItem(TOKEN_KEY)) || AsyncStorage.getItem("token"),
  clearSession: () => AsyncStorage.multiRemove([TOKEN_KEY, "token"]),
};
