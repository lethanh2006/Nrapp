import { apiClient } from "@/src/api/client";
import type {
  IScheduleEntry,
  IScheduleRequest,
  IWorkPolicy,
} from "@/src/features/workschedule/model/workschedule.types";

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
  entries?: IScheduleEntry[];
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

export type WorkscheduleQuery = {
  week?: string;
  status?: string;
  from?: string;
  to?: string;
  employee_id?: string;
};

export interface AttendanceScanResponse {
  success: boolean;
  message?: string;
  data?: {
    check_in_at?: string;
    check_out_at?: string;
    date: string;
    schedule_type: string;
  };
}

export const workscheduleUserApi = {
  getPolicy: () =>
    apiClient.get<{ data: IWorkPolicy }>("/workschedule/policy"),

  getSchedules: (week?: string) =>
    apiClient.get<{ data: IScheduleRequest[] }>(
      "/workschedule/schedule/my",
      { params: week ? { week } : {} },
    ),

  createRequest: (weekStart: string, entries: IScheduleEntry[]) =>
    apiClient.post<{ data: IScheduleRequest }>(
      "/workschedule/schedule/requests",
      { week_start: weekStart, entries },
    ),

  getRequest: (id: string) =>
    apiClient.get<{ data: IScheduleRequest }>(
      `/workschedule/schedule/requests/${encodeURIComponent(id)}`,
    ),

  updateRequest: (id: string, entries: IScheduleEntry[]) =>
    apiClient.patch(`/workschedule/schedule/requests/${encodeURIComponent(id)}`, {
      entries,
    }),

  submitRequest: (id: string) =>
    apiClient.post(
      `/workschedule/schedule/requests/${encodeURIComponent(id)}/submit`,
      {},
    ),

  deleteRequest: (id: string) =>
    apiClient.delete(
      `/workschedule/schedule/requests/${encodeURIComponent(id)}`,
    ),
};

export const workscheduleAdminApi = {
  getPolicy: workscheduleUserApi.getPolicy,

  updatePolicy: (payload: Partial<IWorkPolicy>) =>
    apiClient.patch<{ data: IWorkPolicy }>(
      "/workschedule/policy",
      payload,
    ),

  getPendingSchedules: (week?: string) =>
    apiClient.get<{ data: AdminScheduleRequest[] }>(
      "/workschedule/schedule/pending",
      { params: week ? { week } : {} },
    ),

  getAllSchedules: (params: WorkscheduleQuery = {}) =>
    apiClient.get<{ data: AdminScheduleRequest[] }>(
      "/workschedule/schedule/all",
      { params },
    ),

  getSchedule: (id: string) =>
    apiClient.get<{ data: AdminScheduleRequest }>(
      `/workschedule/schedule/requests/${encodeURIComponent(id)}`,
    ),

  approveRequest: (id: string) =>
    apiClient.post(
      `/workschedule/schedule/requests/${encodeURIComponent(id)}/approve`,
      {},
    ),

  rejectRequest: (id: string, reason?: string) =>
    apiClient.post(
      `/workschedule/schedule/requests/${encodeURIComponent(id)}/reject`,
      { reason },
    ),

  bulkApprove: (ids: string[]) =>
    apiClient.post(
      "/workschedule/schedule/requests/bulk-approve",
      { ids },
    ),

  getHeatmap: (week?: string) =>
    apiClient.get<{ data: AdminHeatmapRow[] }>(
      "/workschedule/schedule/heatmap",
      { params: week ? { week } : {} },
    ),

  generateQr: () =>
    apiClient.post<{
      data: { token: string; expires_at?: string };
    }>("/workschedule/attendance/qr/generate", {}),

  getTodayAttendance: () =>
    apiClient.get<{ data: AdminAttendanceRecord[] }>(
      "/workschedule/attendance/today",
    ),

  getAttendanceReport: (params: WorkscheduleQuery = {}) =>
    apiClient.get<{ data: AdminAttendanceRecord[] }>(
      "/workschedule/attendance/report",
      { params },
    ),

  updateSchedule: (
    id: string,
    entries: { date: string; type: string; note?: string }[],
  ) =>
    apiClient.patch(`/workschedule/schedule/requests/${encodeURIComponent(id)}`, {
      entries,
    }),
};

export const attendanceApi = {
  scan: (token: string) =>
    apiClient.post<AttendanceScanResponse>(
      "/workschedule/attendance/scan",
      { token },
    ),
};
