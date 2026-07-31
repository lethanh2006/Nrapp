import axios from "@/src/utils/axios";
import { ipNR } from "@/src/utils/ip";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  OLD_TOKEN_KEY,
  TOKEN_KEY,
  type AuthSessionResponse,
  type LoginPayload,
  type MessageResponse,
  type RegisterPayload,
  type VerifyOtpPayload,
} from "@/src/services/auth/constant";

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

export async function saveAuthSession({ token }: AuthSessionResponse) {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [OLD_TOKEN_KEY, token],
  ]);
}

export async function getStoredToken() {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) return token;

  return AsyncStorage.getItem(OLD_TOKEN_KEY);
}

export async function clearAuthSession() {
  await AsyncStorage.multiRemove([TOKEN_KEY, OLD_TOKEN_KEY]);
}
