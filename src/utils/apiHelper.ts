import { AxiosError, isAxiosError } from "axios";

export function getAuthHeader(token: string) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (!isAxiosError(error)) return fallback;

  const data = (error as AxiosError<{ message?: string | string[] }>).response
    ?.data;
  const message = data?.message;

  return Array.isArray(message) ? message.join("\n") : message || fallback;
}
