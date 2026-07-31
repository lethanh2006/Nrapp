import axios from "@/src/utils/axios";
import { ipNR } from "@/src/utils/ip";
import type { AuthSessionResponse } from "@/src/features/auth/model/auth.types";
import AsyncStorage from "@react-native-async-storage/async-storage";

const tokenKey = "auth.accessToken";
const oldTokenKey = "token";

type MessageResponse = { message: string };

export async function registerUser(payload: {
  username: string;
  email: string;
  password: string;
}) {
  return axios.post<MessageResponse & { userId: string }>(
    `${ipNR}/auth/register`,
    payload,
  );
}

export async function loginUser(payload: {
  email: string;
  password: string;
}) {
  return axios.post<MessageResponse & { email: string }>(
    `${ipNR}/auth/login`,
    payload,
  );
}

export async function verifyOtp(payload: { email: string; otp: string }) {
  return axios.post<AuthSessionResponse>(`${ipNR}/auth/verify`, payload);
}

export async function saveAuthSession({ token }: AuthSessionResponse) {
  await AsyncStorage.multiSet([
    [tokenKey, token],
    [oldTokenKey, token],
  ]);
}

export async function getStoredToken() {
  const token = await AsyncStorage.getItem(tokenKey);
  if (token) return token;

  return AsyncStorage.getItem(oldTokenKey);
}

export async function clearAuthSession() {
  await AsyncStorage.multiRemove([tokenKey, oldTokenKey]);
}
