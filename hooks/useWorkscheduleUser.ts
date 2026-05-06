import { BASE_URL } from "@/constants/api";
import { useAppData } from "@/context/AppContext";
import axios from "axios";
import { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";
import { IScheduleRequest, IWorkPolicy } from "../components/workschedule/types";

export function useWorkscheduleUser() {
  const { getToken, isAuth } = useAppData();
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

  const getPolicy = useCallback(async (): Promise<IWorkPolicy | null> => {
    try {
      const headers = await getHeaders();
      const res = await api.get("/policy", { headers });
      return res.data.data;
    } catch (err) {
      return null;
    }
  }, [api, getHeaders]);

  const getMySchedules = useCallback(
    async (week?: string): Promise<IScheduleRequest[]> => {
      try {
        setLoading(true);
        const headers = await getHeaders();
        const params = week ? { week } : {};
        const res = await api.get("/schedule/my", { headers, params });
        return res.data.data || [];
      } catch (err: any) {
        Alert.alert("Lỗi", err?.response?.data?.message || "Không thể tải danh sách lịch");
        return [];
      } finally {
        setLoading(false);
      }
    },
    [api, getHeaders]
  );

  const createRequest = useCallback(
    async (week_start: string, entries: any[]): Promise<IScheduleRequest | null> => {
      try {
        setLoading(true);
        const headers = await getHeaders();
        const res = await api.post("/schedule/requests", { week_start, entries }, { headers });
        Alert.alert("Thành công", "Đã tạo lịch nháp");
        return res.data.data;
      } catch (err: any) {
        Alert.alert("Lỗi", err?.response?.data?.message || "Không thể tạo lịch");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [api, getHeaders]
  );

  const getRequestInfo = useCallback(
    async (id: string): Promise<IScheduleRequest | null> => {
      try {
        setLoading(true);
        const headers = await getHeaders();
        const res = await api.get(`/schedule/requests/${id}`, { headers });
        return res.data.data;
      } catch (err: any) {
        Alert.alert("Lỗi", err?.response?.data?.message || "Không thể tải thông tin lịch");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [api, getHeaders]
  );

  const updateEntries = useCallback(
    async (id: string, entries: any[]): Promise<boolean> => {
      try {
        setLoading(true);
        const headers = await getHeaders();
        await api.patch(`/schedule/requests/${id}`, { entries }, { headers });
        Alert.alert("Thành công", "Đã cập nhật lịch");
        return true;
      } catch (err: any) {
        Alert.alert("Lỗi", err?.response?.data?.message || "Không thể cập nhật lịch");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [api, getHeaders]
  );

  const submitRequest = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setLoading(true);
        const headers = await getHeaders();
        await api.post(`/schedule/requests/${id}/submit`, {}, { headers });
        Alert.alert("Thành công", "Đã nộp lịch để chờ duyệt");
        return true;
      } catch (err: any) {
        Alert.alert("Lỗi", err?.response?.data?.message || "Không thể nộp lịch");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [api, getHeaders]
  );

  const deleteRequest = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setLoading(true);
        const headers = await getHeaders();
        await api.delete(`/schedule/requests/${id}`, { headers });
        Alert.alert("Thành công", "Đã xoá lịch nháp");
        return true;
      } catch (err: any) {
        Alert.alert("Lỗi", err?.response?.data?.message || "Không thể xoá lịch");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [api, getHeaders]
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
