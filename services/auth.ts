import { API_ENDPOINTS, TOKEN_KEY, apiClient } from "@/services/api";
import type { AuthSessionResponse, MessageResponse, User } from "@/types/api";
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
  refresh: (token: string) =>
    apiClient.post<AuthSessionResponse>(API_ENDPOINTS.auth.refresh, { token }),
  googleLogin: (token: string) =>
    apiClient.post<AuthSessionResponse>(API_ENDPOINTS.auth.googleLogin, { token }),
  getMe: () => apiClient.get<User>(API_ENDPOINTS.auth.me),
  updateEmail: (email: string) =>
    apiClient.patch<MessageResponse & { email: string }>(
      API_ENDPOINTS.auth.email,
      { email },
    ),
  deleteMe: () => apiClient.delete<MessageResponse>(API_ENDPOINTS.auth.me),
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
