import { useAuthSession } from "@/src/features/auth/model/AuthSessionContext";
import {
  createScheduleRequest,
  getMySchedules as fetchMySchedules,
  getMonthlyScheduleOverview,
  getWorkPolicy,
} from "@/src/services/workschedule/workschedule.service";
import { getApiErrorMessage } from "@/src/utils/apiHelper";
import type {
  IScheduleEntry,
  IScheduleRequest,
  IWorkPolicy,
  IMonthlyScheduleOverview,
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

  const getMonthlyOverview = useCallback(
    async (month: string): Promise<IMonthlyScheduleOverview | null> => {
      try {
        setLoading(true);
        const token = await getToken();
        if (!token) return null;
        const { data } = await getMonthlyScheduleOverview(token, month);
        return data.data || null;
      } catch (error) {
        showError(error, "Không thể tải lịch làm việc trong tháng");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [getToken, showError],
  );

  const sendScheduleRequest = useCallback(
    async (
      weekStart: string,
      entries: IScheduleEntry[],
    ): Promise<boolean> => {
      try {
        setLoading(true);
        const token = await getToken();
        if (!token) return false;

        await createScheduleRequest(token, weekStart, entries);
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

  return {
    loading,
    getPolicy,
    getMySchedules,
    getMonthlyOverview,
    sendScheduleRequest,
  };
}
