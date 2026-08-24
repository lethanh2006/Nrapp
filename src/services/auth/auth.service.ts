import axios from "@/src/utils/axios";
import { ipNR } from "@/src/utils/ip";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import {
  OLD_TOKEN_KEY,
  TOKEN_KEY,
  type AuthSessionResponse,
  type LoginPayload,
  type MessageResponse,
  type RegisterPayload,
  type VerifyOtpPayload,
} from "@/src/services/auth/constant";
import type { KnownAppRole } from "@/src/services/user/constant";
import { getAuthHeader } from "@/src/utils/apiHelper";

export async function registerUser(payload: RegisterPayload) {
  return axios.post<MessageResponse & { userId: string }>(
    `${ipNR}/auth/register`,
    payload,
  );
}

export async function loginUser(payload: LoginPayload) {
  return axios.post<MessageResponse & { email: string }>(
    `${ipNR}/auth/login`,
    payload,
  );
}

export async function verifyOtp(payload: VerifyOtpPayload) {
  return axios.post<AuthSessionResponse>(`${ipNR}/auth/verify`, payload);
}

async function persistToken(token: string) {
  if (Platform.OS === "web") {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } else {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  }
  await AsyncStorage.multiRemove([OLD_TOKEN_KEY, ...(Platform.OS === "web" ? [] : [TOKEN_KEY])]);
}

export async function saveAuthSession({ token }: AuthSessionResponse) {
  await persistToken(token);
}

export async function getStoredToken() {
  const token =
    Platform.OS === "web"
      ? await AsyncStorage.getItem(TOKEN_KEY)
      : await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) return token;

  const legacyToken =
    (await AsyncStorage.getItem(TOKEN_KEY)) ||
    (await AsyncStorage.getItem(OLD_TOKEN_KEY));
  if (!legacyToken) return null;

  await persistToken(legacyToken);
  return legacyToken;
}

export async function clearAuthSession() {
  await AsyncStorage.multiRemove([TOKEN_KEY, OLD_TOKEN_KEY]);
  if (Platform.OS !== "web") {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
}

export async function updateMyEmail(token: string, email: string) {
  return axios.patch<MessageResponse & { email: string }>(
    `${ipNR}/auth/me/email`,
    { email },
    getAuthHeader(token),
  );
}

export async function deleteMyAccount(token: string) {
  return axios.delete<MessageResponse>(
    `${ipNR}/auth/me`,
    getAuthHeader(token),
  );
}

export async function updateUserRoleByAdmin(
  token: string,
  userId: string,
  role: KnownAppRole,
) {
  return axios.patch<MessageResponse & { userId: string; role: string }>(
    `${ipNR}/auth/users/${encodeURIComponent(userId)}/role`,
    { role },
    getAuthHeader(token),
  );
}

export async function deleteUserByAdmin(token: string, userId: string) {
  return axios.delete<MessageResponse>(
    `${ipNR}/auth/users/${encodeURIComponent(userId)}`,
    getAuthHeader(token),
  );
}
