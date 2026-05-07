import { BASE_URL } from "@/constants/api";
import { useAppData } from "@/context/AppContext";
import { IWorkPolicy } from "@/components/workschedule/types";
import axios from "axios";
import { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";

export type AdminEmployeeProfile = {
  _id?: string;
  id?: string;
  name?: string;
  username?: string;
  email?: string;
  role?: string;
};

export type AdminScheduleRequest = {
  _id: string;
  employee_id: string;
  week_start: string;
  status: "draft" | "pending" | "approved" | "rejected";
  submitted_at?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  reject_reason?: string;
  employee?: AdminEmployeeProfile | null;
  entries?: Array<{
    _id?: string;
    date: string;
    type: "office" | "remote" | "day_off" | "leave";
    note?: string;
  }>;
};

export type AdminAttendanceRecord = {
  _id: string;
  employee_id: string;
  date: string;
  schedule_type: "office" | "remote";
  check_in_at?: string;
  check_out_at?: string;
  source: "qr" | "schedule";
  employee?: AdminEmployeeProfile | null;
};

export type AdminHeatmapRow = {
  _id: string;
  stats: Array<{
    type: "office" | "remote" | "day_off" | "leave";
    count: number;
  }>;
};

type QueryParams = {
  week?: string;
  status?: string;
  from?: string;
  to?: string;
  employee_id?: string;
};

export function useWorkscheduleAdmin() {
  const { getToken } = useAppData();
  const [loading, setLoading] = useState(false);

  const api = useMemo(() => {
    return axios.create({
      baseURL: `${BASE_URL}/workschedule`,
    });
  }, []);

  const getHeaders = useCallback(async (): Promise<Record<string, string> | undefined> => {
    const token = await getToken();
    if (!token) return undefined;
    return { Authorization: `Bearer ${token}` };
  }, [getToken]);

  const handleError = useCallback((error: any, fallback: string, silent?: boolean) => {
    if (silent) return;
    Alert.alert("Lỗi", error?.response?.data?.message || fallback);
  }, []);

  const getPolicy = useCallback(
    async (silent = false): Promise<IWorkPolicy | null> => {
      try {
        setLoading(true);
        const headers = await getHeaders();
        const res = await api.get("/policy", { headers });
        return res.data?.data || null;
      } catch (error: any) {
        handleError(error, "Không thể tải chính sách", silent);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [api, getHeaders, handleError],
  );

  const updatePolicy = useCallback(
    async (payload: Partial<IWorkPolicy>, silent = false): Promise<IWorkPolicy | null> => {
      try {
        setLoading(true);
        const headers = await getHeaders();
        const res = await api.patch("/admin/policy", payload, { headers });
        return res.data?.data || null;
      } catch (error: any) {
        handleError(error, "Không thể cập nhật chính sách", silent);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [api, getHeaders, handleError],
  );

  const getPendingSchedules = useCallback(
    async (week?: string, silent = false): Promise<AdminScheduleRequest[]> => {
      try {
        setLoading(true);
        const headers = await getHeaders();
        const params: QueryParams = {};
        if (week) params.week = week;
        const res = await api.get("/admin/schedule/pending", { headers, params });
        return Array.isArray(res.data?.data) ? res.data.data : [];
      } catch (error: any) {
        handleError(error, "Không thể tải danh sách chờ duyệt", silent);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [api, getHeaders, handleError],
  );

  const getAllSchedules = useCallback(
    async (paramsInput: QueryParams = {}, silent = false): Promise<AdminScheduleRequest[]> => {
      try {
        setLoading(true);
        const headers = await getHeaders();
        const params: QueryParams = {};
        if (paramsInput.week) params.week = paramsInput.week;
        if (paramsInput.status && paramsInput.status !== "all") params.status = paramsInput.status;
        const res = await api.get("/admin/schedule/all", { headers, params });
        return Array.isArray(res.data?.data) ? res.data.data : [];
      } catch (error: any) {
        handleError(error, "Không thể tải danh sách lịch", silent);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [api, getHeaders, handleError],
  );

  const getScheduleDetail = useCallback(
    async (id: string, silent = false): Promise<AdminScheduleRequest | null> => {
      try {
        setLoading(true);
        const headers = await getHeaders();
        const res = await api.get(`/schedule/requests/${id}`, { headers });
        return res.data?.data || null;
      } catch (error: any) {
        handleError(error, "Không thể tải chi tiết lịch", silent);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [api, getHeaders, handleError],
  );

  const approveRequest = useCallback(
    async (id: string, silent = false): Promise<boolean> => {
      try {
        setLoading(true);
        const headers = await getHeaders();
        await api.post(`/admin/schedule/${id}/approve`, {}, { headers });
        return true;
      } catch (error: any) {
        handleError(error, "Không thể duyệt lịch", silent);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [api, getHeaders, handleError],
  );

  const rejectRequest = useCallback(
    async (id: string, reason?: string, silent = false): Promise<boolean> => {
      try {
        setLoading(true);
        const headers = await getHeaders();
        await api.post(`/admin/schedule/${id}/reject`, { reason }, { headers });
        return true;
      } catch (error: any) {
        handleError(error, "Không thể từ chối lịch", silent);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [api, getHeaders, handleError],
  );

  const bulkApprove = useCallback(
    async (ids: string[], silent = false): Promise<boolean> => {
      try {
        setLoading(true);
        const headers = await getHeaders();
        await api.post("/admin/schedule/bulk-approve", { ids }, { headers });
        return true;
      } catch (error: any) {
        handleError(error, "Không thể duyệt hàng loạt", silent);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [api, getHeaders, handleError],
  );

  const getHeatmap = useCallback(
    async (week?: string, silent = false): Promise<AdminHeatmapRow[]> => {
      try {
        setLoading(true);
        const headers = await getHeaders();
        const params: QueryParams = {};
        if (week) params.week = week;
        const res = await api.get("/admin/schedule/heatmap", { headers, params });
        return Array.isArray(res.data?.data) ? res.data.data : [];
      } catch (error: any) {
        handleError(error, "Không thể tải heatmap", silent);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [api, getHeaders, handleError],
  );

  const generateQrToken = useCallback(
    async (silent = false): Promise<{ token: string; expires_at?: string } | null> => {
      try {
        setLoading(true);
        const headers = await getHeaders();
        const res = await api.post("/admin/attendance/qr/generate", {}, { headers });
        return res.data?.data || null;
      } catch (error: any) {
        handleError(error, "Không thể tạo QR chấm công", silent);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [api, getHeaders, handleError],
  );

  const getTodayAttendance = useCallback(
    async (silent = false): Promise<AdminAttendanceRecord[]> => {
      try {
        setLoading(true);
        const headers = await getHeaders();
        const res = await api.get("/admin/attendance/today", { headers });
        return Array.isArray(res.data?.data) ? res.data.data : [];
      } catch (error: any) {
        handleError(error, "Không thể tải chấm công hôm nay", silent);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [api, getHeaders, handleError],
  );

  const getReport = useCallback(
    async (paramsInput: QueryParams = {}, silent = false): Promise<AdminAttendanceRecord[]> => {
      try {
        setLoading(true);
        const headers = await getHeaders();
        const params: QueryParams = {};
        if (paramsInput.from) params.from = paramsInput.from;
        if (paramsInput.to) params.to = paramsInput.to;
        if (paramsInput.employee_id) params.employee_id = paramsInput.employee_id;
        const res = await api.get("/admin/attendance/report", { headers, params });
        return Array.isArray(res.data?.data) ? res.data.data : [];
      } catch (error: any) {
        handleError(error, "Không thể tải báo cáo chấm công", silent);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [api, getHeaders, handleError],
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
  };
}