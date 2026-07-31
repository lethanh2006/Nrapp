import { createAuthHeaders, getApiErrorMessage } from "@/src/api/client";
import { useAuthSession } from "@/src/features/auth/model/AuthSessionContext";
import { isAxiosError } from "axios";
import { useCallback, useState } from "react";
import { Alert } from "react-native";

type RequestOptions<T> = {
  errorMessage: string;
  fallbackValue: T;
  silent?: boolean;
};

export function useWorkscheduleRequest() {
  const { getToken } = useAuthSession();
  const [pendingRequests, setPendingRequests] = useState(0);

  const run = useCallback(
    async <T>(
      request: (
        headers: Record<string, string> | undefined,
      ) => Promise<T>,
      options: RequestOptions<T>,
    ): Promise<T> => {
      setPendingRequests((count) => count + 1);
      try {
        const token = await getToken();
        return await request(createAuthHeaders(token));
      } catch (error: unknown) {
        const unauthorized =
          isAxiosError(error) && error.response?.status === 401;
        if (!options.silent && !unauthorized) {
          Alert.alert(
            "Lỗi",
            getApiErrorMessage(error, options.errorMessage),
          );
        }
        return options.fallbackValue;
      } finally {
        setPendingRequests((count) => Math.max(0, count - 1));
      }
    },
    [getToken],
  );

  return {
    loading: pendingRequests > 0,
    run,
  };
}
