import { workscheduleClient } from "@/src/api/client";
import { API_ENDPOINTS } from "@/src/api/endpoints";
import { useWorkscheduleRequest } from "@/src/features/workschedule/api/useWorkscheduleRequest";
import type { IWorkPolicy } from "@/src/features/workschedule/model/workschedule.types";
import { useCallback } from "react";

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
  entries?: {
    _id?: string;
    date: string;
    type: "office" | "remote" | "day_off" | "leave";
    note?: string;
  }[];
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
  stats: {
    type: "office" | "remote" | "day_off" | "leave";
    count: number;
  }[];
};

type QueryParams = {
  week?: string;
  status?: string;
  from?: string;
  to?: string;
  employee_id?: string;
};

const dataOrNull = <T,>(response: { data?: { data?: T } }) =>
  response.data?.data ?? null;

const dataOrList = <T,>(response: { data?: { data?: T[] } }) =>
  Array.isArray(response.data?.data) ? response.data.data : [];

export function useWorkscheduleAdmin() {
  const { loading, run } = useWorkscheduleRequest();

  const getPolicy = useCallback(
    (silent = false) =>
      run<IWorkPolicy | null>(
        async (headers) =>
          dataOrNull(
            await workscheduleClient.get(API_ENDPOINTS.workschedule.policy, {
              headers,
            }),
          ),
        {
          errorMessage: "Không thể tải chính sách",
          fallbackValue: null,
          silent,
        },
      ),
    [run],
  );

  const updatePolicy = useCallback(
    (payload: Partial<IWorkPolicy>, silent = false) =>
      run<IWorkPolicy | null>(
        async (headers) =>
          dataOrNull(
            await workscheduleClient.patch(
              API_ENDPOINTS.workschedule.admin.policy,
              payload,
              { headers },
            ),
          ),
        {
          errorMessage: "Không thể cập nhật chính sách",
          fallbackValue: null,
          silent,
        },
      ),
    [run],
  );

  const getPendingSchedules = useCallback(
    (week?: string, silent = false) =>
      run<AdminScheduleRequest[]>(
        async (headers) =>
          dataOrList(
            await workscheduleClient.get(
              API_ENDPOINTS.workschedule.admin.pendingSchedules,
              { headers, params: week ? { week } : {} },
            ),
          ),
        {
          errorMessage: "Không thể tải danh sách chờ duyệt",
          fallbackValue: [],
          silent,
        },
      ),
    [run],
  );

  const getAllSchedules = useCallback(
    (params: QueryParams = {}, silent = false) =>
      run<AdminScheduleRequest[]>(
        async (headers) => {
          const query: QueryParams = {};
          if (params.week) query.week = params.week;
          if (params.status && params.status !== "all") {
            query.status = params.status;
          }
          return dataOrList(
            await workscheduleClient.get(
              API_ENDPOINTS.workschedule.admin.allSchedules,
              { headers, params: query },
            ),
          );
        },
        {
          errorMessage: "Không thể tải danh sách lịch",
          fallbackValue: [],
          silent,
        },
      ),
    [run],
  );

  const getScheduleDetail = useCallback(
    (id: string, silent = false) =>
      run<AdminScheduleRequest | null>(
        async (headers) =>
          dataOrNull(
            await workscheduleClient.get(
              API_ENDPOINTS.workschedule.request(id),
              { headers },
            ),
          ),
        {
          errorMessage: "Không thể tải chi tiết lịch",
          fallbackValue: null,
          silent,
        },
      ),
    [run],
  );

  const mutate = useCallback(
    (
      request: (
        headers: Record<string, string> | undefined,
      ) => Promise<unknown>,
      errorMessage: string,
      silent = false,
    ) =>
      run(
        async (headers) => {
          await request(headers);
          return true;
        },
        { errorMessage, fallbackValue: false, silent },
      ),
    [run],
  );

  const approveRequest = useCallback(
    (id: string, silent = false) =>
      mutate(
        (headers) =>
          workscheduleClient.post(
            API_ENDPOINTS.workschedule.admin.approve(id),
            {},
            { headers },
          ),
        "Không thể duyệt lịch",
        silent,
      ),
    [mutate],
  );

  const rejectRequest = useCallback(
    (id: string, reason?: string, silent = false) =>
      mutate(
        (headers) =>
          workscheduleClient.post(
            API_ENDPOINTS.workschedule.admin.reject(id),
            { reason },
            { headers },
          ),
        "Không thể từ chối lịch",
        silent,
      ),
    [mutate],
  );

  const bulkApprove = useCallback(
    (ids: string[], silent = false) =>
      mutate(
        (headers) =>
          workscheduleClient.post(
            API_ENDPOINTS.workschedule.admin.bulkApprove,
            { ids },
            { headers },
          ),
        "Không thể duyệt hàng loạt",
        silent,
      ),
    [mutate],
  );

  const getHeatmap = useCallback(
    (week?: string, silent = false) =>
      run<AdminHeatmapRow[]>(
        async (headers) =>
          dataOrList(
            await workscheduleClient.get(
              API_ENDPOINTS.workschedule.admin.heatmap,
              { headers, params: week ? { week } : {} },
            ),
          ),
        {
          errorMessage: "Không thể tải heatmap",
          fallbackValue: [],
          silent,
        },
      ),
    [run],
  );

  const generateQrToken = useCallback(
    (silent = false) =>
      run<{ token: string; expires_at?: string } | null>(
        async (headers) =>
          dataOrNull(
            await workscheduleClient.post(
              API_ENDPOINTS.workschedule.admin.generateQr,
              {},
              { headers },
            ),
          ),
        {
          errorMessage: "Không thể tạo QR chấm công",
          fallbackValue: null,
          silent,
        },
      ),
    [run],
  );

  const getTodayAttendance = useCallback(
    (silent = false) =>
      run<AdminAttendanceRecord[]>(
        async (headers) =>
          dataOrList(
            await workscheduleClient.get(
              API_ENDPOINTS.workschedule.admin.todayAttendance,
              { headers },
            ),
          ),
        {
          errorMessage: "Không thể tải chấm công hôm nay",
          fallbackValue: [],
          silent,
        },
      ),
    [run],
  );

  const getReport = useCallback(
    (params: QueryParams = {}, silent = false) =>
      run<AdminAttendanceRecord[]>(
        async (headers) => {
          const query: QueryParams = {};
          if (params.from) query.from = params.from;
          if (params.to) query.to = params.to;
          if (params.employee_id) query.employee_id = params.employee_id;
          return dataOrList(
            await workscheduleClient.get(
              API_ENDPOINTS.workschedule.admin.attendanceReport,
              { headers, params: query },
            ),
          );
        },
        {
          errorMessage: "Không thể tải báo cáo chấm công",
          fallbackValue: [],
          silent,
        },
      ),
    [run],
  );

  const adminUpdateEntries = useCallback(
    (
      id: string,
      entries: { date: string; type: string; note?: string }[],
      silent = false,
    ) =>
      mutate(
        (headers) =>
          workscheduleClient.patch(
            API_ENDPOINTS.workschedule.request(id),
            { entries },
            { headers },
          ),
        "Không thể cập nhật lịch làm việc của nhân viên",
        silent,
      ),
    [mutate],
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
