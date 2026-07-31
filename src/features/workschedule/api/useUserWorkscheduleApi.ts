import { useAuthSession } from "@/src/features/auth/model/AuthSessionContext";
import { createAuthHeaders, workscheduleClient } from "@/src/shared/api/http-client";
import { WORKSCHEDULE_ENDPOINTS } from "@/src/features/workschedule/api/workschedule.endpoints";
import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { IScheduleRequest, IWorkPolicy } from "@/src/features/workschedule/model/workschedule.types";

export function useWorkscheduleUser() {
  const { getToken } = useAuthSession();
  const [loading, setLoading] = useState(false);

  const getHeaders = useCallback(async (): Promise<Record<string, string> | undefined> => {
    const token = await getToken();
    if (!token) return undefined;
    return createAuthHeaders(token);
  }, [getToken]);

  const handleError = useCallback((error: any, fallback: string) => {
    if (error?.response?.status === 401) return;
    Alert.alert("Lỗi", error?.response?.data?.message || fallback);
  }, []);

  const getPolicy = useCallback(async (): Promise<IWorkPolicy | null> => {
    try {
      const headers = await getHeaders();
      const res = await workscheduleClient.get(WORKSCHEDULE_ENDPOINTS.policy, { headers });
      return res.data.data;
    } catch {
      return null;
    }
  }, [getHeaders]);

  const getMySchedules = useCallback(
    async (week?: string): Promise<IScheduleRequest[]> => {
      try {
        setLoading(true);
        const headers = await getHeaders();
        const params = week ? { week } : {};
        const res = await workscheduleClient.get(WORKSCHEDULE_ENDPOINTS.mySchedules, { headers, params });
        return res.data.data || [];
      } catch (err: any) {
        handleError(err, "Không thể tải danh sách lịch");
        return [];
      } finally {
        setLoading(false);
      }
    },
    [getHeaders, handleError]
  );

  const createRequest = useCallback(
    async (week_start: string, entries: any[], showAlert: boolean = true): Promise<IScheduleRequest | null> => {
      try {
        setLoading(true);
        const headers = await getHeaders();
        const res = await workscheduleClient.post(WORKSCHEDULE_ENDPOINTS.requests, { week_start, entries }, { headers });
        if (showAlert) {
          Alert.alert("Thành công", "Đã tạo lịch nháp");
        }
        return res.data.data;
      } catch (err: any) {
        handleError(err, "Không thể tạo lịch");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [getHeaders, handleError]
  );

  const getRequestInfo = useCallback(
    async (id: string): Promise<IScheduleRequest | null> => {
      try {
        setLoading(true);
        const headers = await getHeaders();
        const res = await workscheduleClient.get(WORKSCHEDULE_ENDPOINTS.request(id), { headers });
        return res.data.data;
      } catch (err: any) {
        handleError(err, "Không thể tải thông tin lịch");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [getHeaders, handleError]
  );

  const updateEntries = useCallback(
    async (id: string, entries: any[], showAlert: boolean = true): Promise<boolean> => {
      try {
        setLoading(true);
        const headers = await getHeaders();
        await workscheduleClient.patch(WORKSCHEDULE_ENDPOINTS.request(id), { entries }, { headers });
        if (showAlert) {
          Alert.alert("Thành công", "Đã cập nhật lịch");
        }
        return true;
      } catch (err: any) {
        handleError(err, "Không thể cập nhật lịch");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [getHeaders, handleError]
  );

  const submitRequest = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setLoading(true);
        const headers = await getHeaders();
        await workscheduleClient.post(WORKSCHEDULE_ENDPOINTS.submitRequest(id), {}, { headers });
        Alert.alert("Thành công", "Đã nộp lịch để chờ duyệt");
        return true;
      } catch (err: any) {
        handleError(err, "Không thể nộp lịch");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [getHeaders, handleError]
  );

  const deleteRequest = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setLoading(true);
        const headers = await getHeaders();
        await workscheduleClient.delete(WORKSCHEDULE_ENDPOINTS.request(id), { headers });
        Alert.alert("Thành công", "Đã xoá lịch nháp");
        return true;
      } catch (err: any) {
        handleError(err, "Không thể xoá lịch");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [getHeaders, handleError]
  );

  return {
    loading,
    getPolicy,
    getMySchedules,
    createRequest,
    getRequestInfo,
    updateEntries,
    submitRequest,
    deleteRequest,
  };
}
