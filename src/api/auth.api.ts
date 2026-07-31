import { apiClient, TOKEN_KEY } from "@/src/api/client";
import type { AuthSessionResponse } from "@/src/features/auth/model/auth.types";
import AsyncStorage from "@react-native-async-storage/async-storage";

type MessageResponse = { message: string };

export const authApi = {
  register: (payload: { username: string; email: string; password: string }) =>
    apiClient.post<MessageResponse & { userId: string }>(
      "/auth/register",
      payload,
    ),
  login: (payload: { email: string; password: string }) =>
    apiClient.post<MessageResponse & { email: string }>(
      "/auth/login",
      payload,
    ),
  verify: (payload: { email: string; otp: string }) =>
    apiClient.post<AuthSessionResponse>("/auth/verify", payload),
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
