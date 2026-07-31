import { workscheduleClient } from "@/src/api/client";
import { API_ENDPOINTS } from "@/src/api/endpoints";
import { useWorkscheduleRequest } from "@/src/features/workschedule/api/useWorkscheduleRequest";
import type {
  IScheduleEntry,
  IScheduleRequest,
  IWorkPolicy,
} from "@/src/features/workschedule/model/workschedule.types";
import { useCallback } from "react";
import { Alert } from "react-native";

export function useWorkscheduleUser() {
  const { loading, run } = useWorkscheduleRequest();

  const getPolicy = useCallback(
    () =>
      run<IWorkPolicy | null>(
        async (headers) => {
          const response = await workscheduleClient.get(
            API_ENDPOINTS.workschedule.policy,
            { headers },
          );
          return response.data?.data ?? null;
        },
        {
          errorMessage: "Không thể tải chính sách",
          fallbackValue: null,
          silent: true,
        },
      ),
    [run],
  );

  const getMySchedules = useCallback(
    (week?: string) =>
      run<IScheduleRequest[]>(
        async (headers) => {
          const response = await workscheduleClient.get(
            API_ENDPOINTS.workschedule.mySchedules,
            { headers, params: week ? { week } : {} },
          );
          return Array.isArray(response.data?.data) ? response.data.data : [];
        },
        {
          errorMessage: "Không thể tải danh sách lịch",
          fallbackValue: [],
        },
      ),
    [run],
  );

  const createRequest = useCallback(
    (
      weekStart: string,
      entries: IScheduleEntry[],
      showAlert = true,
    ) =>
      run<IScheduleRequest | null>(
        async (headers) => {
          const response = await workscheduleClient.post(
            API_ENDPOINTS.workschedule.requests,
            { week_start: weekStart, entries },
            { headers },
          );
          if (showAlert) Alert.alert("Thành công", "Đã tạo lịch nháp");
          return response.data?.data ?? null;
        },
        {
          errorMessage: "Không thể tạo lịch",
          fallbackValue: null,
        },
      ),
    [run],
  );

  const getRequestInfo = useCallback(
    (id: string) =>
      run<IScheduleRequest | null>(
        async (headers) => {
          const response = await workscheduleClient.get(
            API_ENDPOINTS.workschedule.request(id),
            { headers },
          );
          return response.data?.data ?? null;
        },
        {
          errorMessage: "Không thể tải thông tin lịch",
          fallbackValue: null,
        },
      ),
    [run],
  );

  const updateEntries = useCallback(
    (id: string, entries: IScheduleEntry[], showAlert = true) =>
      run(
        async (headers) => {
          await workscheduleClient.patch(
            API_ENDPOINTS.workschedule.request(id),
            { entries },
            { headers },
          );
          if (showAlert) Alert.alert("Thành công", "Đã cập nhật lịch");
          return true;
        },
        {
          errorMessage: "Không thể cập nhật lịch",
          fallbackValue: false,
        },
      ),
    [run],
  );

  const submitRequest = useCallback(
    (id: string) =>
      run(
        async (headers) => {
          await workscheduleClient.post(
            API_ENDPOINTS.workschedule.submitRequest(id),
            {},
            { headers },
          );
          Alert.alert("Thành công", "Đã nộp lịch để chờ duyệt");
          return true;
        },
        {
          errorMessage: "Không thể nộp lịch",
          fallbackValue: false,
        },
      ),
    [run],
  );

  const deleteRequest = useCallback(
    (id: string) =>
      run(
        async (headers) => {
          await workscheduleClient.delete(
            API_ENDPOINTS.workschedule.request(id),
            { headers },
          );
          Alert.alert("Thành công", "Đã xoá lịch nháp");
          return true;
        },
        {
          errorMessage: "Không thể xoá lịch",
          fallbackValue: false,
        },
      ),
    [run],
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
