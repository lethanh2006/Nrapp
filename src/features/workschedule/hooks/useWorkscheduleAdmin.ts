import { getApiErrorMessage } from "@/src/api/client";
import {
  workscheduleAdminApi,
  type AdminAttendanceRecord,
  type AdminHeatmapRow,
  type AdminScheduleRequest,
  type WorkscheduleQuery,
} from "@/src/api/workschedule.api";
import type { IWorkPolicy } from "@/src/features/workschedule/model/workschedule.types";
import { useCallback, useState } from "react";
import { Alert } from "react-native";

export type {
  AdminAttendanceRecord,
  AdminEmployeeProfile,
  AdminHeatmapRow,
  AdminScheduleRequest,
} from "@/src/api/workschedule.api";

export function useWorkscheduleAdmin() {
  const [loading, setLoading] = useState(false);

  const showError = useCallback(
    (error: unknown, fallback: string, silent = false) => {
      if (!silent) Alert.alert("Lỗi", getApiErrorMessage(error, fallback));
    },
    [],
  );

  const getPolicy = useCallback(
    async (silent = false): Promise<IWorkPolicy | null> => {
      try {
        setLoading(true);
        const { data } = await workscheduleAdminApi.getPolicy();
        return data.data || null;
      } catch (error) {
        showError(error, "Không thể tải chính sách", silent);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [showError],
  );

  const updatePolicy = useCallback(
    async (
      payload: Partial<IWorkPolicy>,
      silent = false,
    ): Promise<IWorkPolicy | null> => {
      try {
        setLoading(true);
        const { data } = await workscheduleAdminApi.updatePolicy(payload);
        return data.data || null;
      } catch (error) {
        showError(error, "Không thể cập nhật chính sách", silent);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [showError],
  );

  const getPendingSchedules = useCallback(
    async (week?: string, silent = false): Promise<AdminScheduleRequest[]> => {
      try {
        setLoading(true);
        const { data } = await workscheduleAdminApi.getPendingSchedules(week);
        return Array.isArray(data.data) ? data.data : [];
      } catch (error) {
        showError(error, "Không thể tải danh sách chờ duyệt", silent);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [showError],
  );

  const getAllSchedules = useCallback(
    async (
      params: WorkscheduleQuery = {},
      silent = false,
    ): Promise<AdminScheduleRequest[]> => {
      try {
        setLoading(true);
        const query = {
          ...params,
          status: params.status === "all" ? undefined : params.status,
        };
        const { data } = await workscheduleAdminApi.getAllSchedules(query);
        return Array.isArray(data.data) ? data.data : [];
      } catch (error) {
        showError(error, "Không thể tải danh sách lịch", silent);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [showError],
  );

  const getScheduleDetail = useCallback(
    async (id: string, silent = false): Promise<AdminScheduleRequest | null> => {
      try {
        setLoading(true);
        const { data } = await workscheduleAdminApi.getSchedule(id);
        return data.data || null;
      } catch (error) {
        showError(error, "Không thể tải chi tiết lịch", silent);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [showError],
  );

  const approveRequest = useCallback(
    async (id: string, silent = false) => {
      try {
        setLoading(true);
        await workscheduleAdminApi.approveRequest(id);
        return true;
      } catch (error) {
        showError(error, "Không thể duyệt lịch", silent);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [showError],
  );

  const rejectRequest = useCallback(
    async (id: string, reason?: string, silent = false) => {
      try {
        setLoading(true);
        await workscheduleAdminApi.rejectRequest(id, reason);
        return true;
      } catch (error) {
        showError(error, "Không thể từ chối lịch", silent);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [showError],
  );

  const bulkApprove = useCallback(
    async (ids: string[], silent = false) => {
      try {
        setLoading(true);
        await workscheduleAdminApi.bulkApprove(ids);
        return true;
      } catch (error) {
        showError(error, "Không thể duyệt hàng loạt", silent);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [showError],
  );

  const getHeatmap = useCallback(
    async (week?: string, silent = false): Promise<AdminHeatmapRow[]> => {
      try {
        setLoading(true);
        const { data } = await workscheduleAdminApi.getHeatmap(week);
        return Array.isArray(data.data) ? data.data : [];
      } catch (error) {
        showError(error, "Không thể tải heatmap", silent);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [showError],
  );

  const generateQrToken = useCallback(
    async (silent = false) => {
      try {
        setLoading(true);
        const { data } = await workscheduleAdminApi.generateQr();
        return data.data || null;
      } catch (error) {
        showError(error, "Không thể tạo QR chấm công", silent);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [showError],
  );

  const getTodayAttendance = useCallback(
    async (silent = false): Promise<AdminAttendanceRecord[]> => {
      try {
        setLoading(true);
        const { data } = await workscheduleAdminApi.getTodayAttendance();
        return Array.isArray(data.data) ? data.data : [];
      } catch (error) {
        showError(error, "Không thể tải chấm công hôm nay", silent);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [showError],
  );

  const getReport = useCallback(
    async (
      params: WorkscheduleQuery = {},
      silent = false,
    ): Promise<AdminAttendanceRecord[]> => {
      try {
        setLoading(true);
        const { data } = await workscheduleAdminApi.getAttendanceReport(params);
        return Array.isArray(data.data) ? data.data : [];
      } catch (error) {
        showError(error, "Không thể tải báo cáo chấm công", silent);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [showError],
  );

  const adminUpdateEntries = useCallback(
    async (
      id: string,
      entries: { date: string; type: string; note?: string }[],
      silent = false,
    ) => {
      try {
        setLoading(true);
        await workscheduleAdminApi.updateSchedule(id, entries);
        return true;
      } catch (error) {
        showError(error, "Không thể cập nhật lịch làm việc", silent);
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
    updatePolicy,
    getPendingSchedules,
    getAllSchedules,
    getScheduleDetail,
    approveRequest,
    rejectRequest,
    bulkApprove,
    getHeatmap,
    generateQrToken,
    getTodayAttendance,
    getReport,
    adminUpdateEntries,
  };
}
