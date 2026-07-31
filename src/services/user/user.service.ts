import axios from "@/src/utils/axios";
import { getAuthHeader } from "@/src/utils/apiHelper";
import { ipNR } from "@/src/utils/ip";
import type { User } from "@/src/services/user/constant";

export async function getUserProfile(token: string) {
  return axios.get<{ user: User }>(
    `${ipNR}/user/me`,
    getAuthHeader(token),
  );
}

export async function getAllUsers(token: string) {
  return axios.get<{ users: User[] }>(
    `${ipNR}/user/user/all`,
    getAuthHeader(token),
  );
}
