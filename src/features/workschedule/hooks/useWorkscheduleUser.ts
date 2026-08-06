import { useAuthSession } from "@/src/features/auth/model/AuthSessionContext";
import {
  createScheduleRequest,
  deleteScheduleRequest,
  getMySchedules as fetchMySchedules,
  getScheduleRequest,
  getWorkPolicy,
  submitScheduleRequest,
  updateScheduleRequest,
} from "@/src/services/workschedule/workschedule.service";
import { getApiErrorMessage } from "@/src/utils/apiHelper";
import type {
  IScheduleEntry,
  IScheduleRequest,
  IWorkPolicy,
} from "@/src/services/workschedule/constant";
import { useCallback, useState } from "react";
import { AppAlert as Alert } from "@/src/shared/ui/AppAlert";

export function useWorkscheduleUser() {
  const { getToken } = useAuthSession();
  const [loading, setLoading] = useState(false);

  const showError = useCallback((error: unknown, fallback: string) => {
    Alert.alert("Lỗi", getApiErrorMessage(error, fallback));
  }, []);

  const getPolicy = useCallback(async (): Promise<IWorkPolicy | null> => {
    try {
      const token = await getToken();
      if (!token) return null;
      const { data } = await getWorkPolicy(token);
      return data.data || null;
    } catch {
      return null;
    }
  }, [getToken]);

  const getMySchedules = useCallback(
    async (week?: string): Promise<IScheduleRequest[]> => {
      try {
        setLoading(true);
        const token = await getToken();
        if (!token) return [];
        const { data } = await fetchMySchedules(token, week);
        return Array.isArray(data.data) ? data.data : [];
      } catch (error) {
        showError(error, "Không thể tải danh sách lịch");
        return [];
      } finally {
        setLoading(false);
      }
    },
    [getToken, showError],
  );

  const createRequest = useCallback(
    async (
      weekStart: string,
      entries: IScheduleEntry[],
      showSuccess = true,
    ): Promise<IScheduleRequest | null> => {
      try {
        setLoading(true);
        const token = await getToken();
        if (!token) return null;
        const { data } = await createScheduleRequest(
          token,
          weekStart,
          entries,
        );
        if (showSuccess) Alert.alert("Thành công", "Đã tạo lịch nháp");
        return data.data || null;
      } catch (error) {
        showError(error, "Không thể tạo lịch");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [getToken, showError],
  );

  const getRequestInfo = useCallback(
    async (id: string): Promise<IScheduleRequest | null> => {
      try {
        setLoading(true);
        const token = await getToken();
        if (!token) return null;
        const { data } = await getScheduleRequest(token, id);
        return data.data || null;
      } catch (error) {
        showError(error, "Không thể tải thông tin lịch");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [getToken, showError],
  );

  const updateEntries = useCallback(
    async (id: string, entries: IScheduleEntry[], showSuccess = true) => {
      try {
        setLoading(true);
        const token = await getToken();
        if (!token) return false;
        await updateScheduleRequest(token, id, entries);
        if (showSuccess) Alert.alert("Thành công", "Đã cập nhật lịch");
        return true;
      } catch (error) {
        showError(error, "Không thể cập nhật lịch");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [getToken, showError],
  );

  const submitRequest = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        const token = await getToken();
        if (!token) return false;
        await submitScheduleRequest(token, id);
        Alert.alert("Thành công", "Đã nộp lịch để chờ duyệt");
        return true;
      } catch (error) {
        showError(error, "Không thể nộp lịch");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [getToken, showError],
  );

  const deleteRequest = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        const token = await getToken();
        if (!token) return false;
        await deleteScheduleRequest(token, id);
        Alert.alert("Thành công", "Đã xoá lịch nháp");
        return true;
      } catch (error) {
        showError(error, "Không thể xoá lịch");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [getToken, showError],
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
