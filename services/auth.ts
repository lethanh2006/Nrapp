import { API_ENDPOINTS, TOKEN_KEY, apiClient } from "@/services/api";
import type { AuthSessionResponse, MessageResponse } from "@/types/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const authService = {
  register: (payload: { username: string; email: string; password: string }) =>
    apiClient.post<MessageResponse & { userId: string }>(
      API_ENDPOINTS.auth.register,
      payload,
    ),
  login: (payload: { email: string; password: string }) =>
    apiClient.post<MessageResponse & { email: string }>(
      API_ENDPOINTS.auth.login,
      payload,
    ),
  verify: (payload: { email: string; otp: string }) =>
    apiClient.post<AuthSessionResponse>(API_ENDPOINTS.auth.verify, payload),
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
