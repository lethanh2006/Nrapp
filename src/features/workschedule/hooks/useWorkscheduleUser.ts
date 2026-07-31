import { getApiErrorMessage } from "@/src/api/client";
import { workscheduleUserApi } from "@/src/api/workschedule.api";
import type {
  IScheduleEntry,
  IScheduleRequest,
  IWorkPolicy,
} from "@/src/features/workschedule/model/workschedule.types";
import { useCallback, useState } from "react";
import { Alert } from "react-native";

export function useWorkscheduleUser() {
  const [loading, setLoading] = useState(false);

  const showError = useCallback((error: unknown, fallback: string) => {
    Alert.alert("Lỗi", getApiErrorMessage(error, fallback));
  }, []);

  const getPolicy = useCallback(async (): Promise<IWorkPolicy | null> => {
    try {
      const { data } = await workscheduleUserApi.getPolicy();
      return data.data || null;
    } catch {
      return null;
    }
  }, []);

  const getMySchedules = useCallback(
    async (week?: string): Promise<IScheduleRequest[]> => {
      try {
        setLoading(true);
        const { data } = await workscheduleUserApi.getSchedules(week);
        return Array.isArray(data.data) ? data.data : [];
      } catch (error) {
        showError(error, "Không thể tải danh sách lịch");
        return [];
      } finally {
        setLoading(false);
      }
    },
    [showError],
  );

  const createRequest = useCallback(
    async (
      weekStart: string,
      entries: IScheduleEntry[],
      showSuccess = true,
    ): Promise<IScheduleRequest | null> => {
      try {
        setLoading(true);
        const { data } = await workscheduleUserApi.createRequest(
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
    [showError],
  );

  const getRequestInfo = useCallback(
    async (id: string): Promise<IScheduleRequest | null> => {
      try {
        setLoading(true);
        const { data } = await workscheduleUserApi.getRequest(id);
        return data.data || null;
      } catch (error) {
        showError(error, "Không thể tải thông tin lịch");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [showError],
  );

  const updateEntries = useCallback(
    async (id: string, entries: IScheduleEntry[], showSuccess = true) => {
      try {
        setLoading(true);
        await workscheduleUserApi.updateRequest(id, entries);
        if (showSuccess) Alert.alert("Thành công", "Đã cập nhật lịch");
        return true;
      } catch (error) {
        showError(error, "Không thể cập nhật lịch");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [showError],
  );

  const submitRequest = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        await workscheduleUserApi.submitRequest(id);
        Alert.alert("Thành công", "Đã nộp lịch để chờ duyệt");
        return true;
      } catch (error) {
        showError(error, "Không thể nộp lịch");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [showError],
  );

  const deleteRequest = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        await workscheduleUserApi.deleteRequest(id);
        Alert.alert("Thành công", "Đã xoá lịch nháp");
        return true;
      } catch (error) {
        showError(error, "Không thể xoá lịch");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [showError],
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
