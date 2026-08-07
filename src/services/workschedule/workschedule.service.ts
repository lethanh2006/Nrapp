import axios from "@/src/utils/axios";
import { getAuthHeader } from "@/src/utils/apiHelper";
import { ipNR } from "@/src/utils/ip";
import type {
  AdminAttendanceRecord,
  AdminHeatmapRow,
  AdminScheduleRequest,
  AttendanceScanResponse,
  IScheduleEntry,
  IScheduleRequest,
  IMonthlyScheduleOverview,
  IWorkPolicy,
  WorkscheduleQuery,
} from "@/src/services/workschedule/constant";

export async function getMonthlyScheduleOverview(token: string, month: string) {
  return axios.get<{ data: IMonthlyScheduleOverview }>(
    `${ipNR}/workschedule/schedule/monthly-overview`,
    { ...getAuthHeader(token), params: { month } },
  );
}

export async function getWorkPolicy(token: string) {
  return axios.get<{ data: IWorkPolicy }>(
    `${ipNR}/workschedule/policy`,
    getAuthHeader(token),
  );
}

export async function getMySchedules(token: string, week?: string) {
  return axios.get<{ data: IScheduleRequest[] }>(
    `${ipNR}/workschedule/schedule/my`,
    {
      ...getAuthHeader(token),
      params: week ? { week } : {},
    },
  );
}

export async function createScheduleRequest(
  token: string,
  weekStart: string,
  entries: IScheduleEntry[],
) {
  return axios.post<{ data: IScheduleRequest }>(
    `${ipNR}/workschedule/schedule/requests`,
    { week_start: weekStart, entries },
    getAuthHeader(token),
  );
}

export async function getScheduleRequest(token: string, id: string) {
  return axios.get<{ data: IScheduleRequest }>(
    `${ipNR}/workschedule/schedule/requests/${encodeURIComponent(id)}`,
    getAuthHeader(token),
  );
}

export async function updateScheduleRequest(
  token: string,
  id: string,
  entries: IScheduleEntry[],
) {
  return axios.patch(
    `${ipNR}/workschedule/schedule/requests/${encodeURIComponent(id)}`,
    { entries },
    getAuthHeader(token),
  );
}

export async function submitScheduleRequest(token: string, id: string) {
  return axios.post(
    `${ipNR}/workschedule/schedule/requests/${encodeURIComponent(id)}/submit`,
    {},
    getAuthHeader(token),
  );
}

export async function deleteScheduleRequest(token: string, id: string) {
  return axios.delete(
    `${ipNR}/workschedule/schedule/requests/${encodeURIComponent(id)}`,
    getAuthHeader(token),
  );
}

export async function updateWorkPolicy(
  token: string,
  payload: Partial<IWorkPolicy>,
) {
  return axios.patch<{ data: IWorkPolicy }>(
    `${ipNR}/workschedule/policy`,
    payload,
    getAuthHeader(token),
  );
}

export async function getPendingSchedules(token: string, week?: string) {
  return axios.get<{ data: AdminScheduleRequest[] }>(
    `${ipNR}/workschedule/schedule/pending`,
    {
      ...getAuthHeader(token),
      params: week ? { week } : {},
    },
  );
}

export async function getAllSchedules(
  token: string,
  params: WorkscheduleQuery = {},
) {
  return axios.get<{ data: AdminScheduleRequest[] }>(
    `${ipNR}/workschedule/schedule/all`,
    { ...getAuthHeader(token), params },
  );
}

export async function getAdminSchedule(token: string, id: string) {
  return axios.get<{ data: AdminScheduleRequest }>(
    `${ipNR}/workschedule/schedule/requests/${encodeURIComponent(id)}`,
    getAuthHeader(token),
  );
}

export async function approveSchedule(token: string, id: string) {
  return axios.post(
    `${ipNR}/workschedule/schedule/requests/${encodeURIComponent(id)}/approve`,
    {},
    getAuthHeader(token),
  );
}

export async function rejectSchedule(
  token: string,
  id: string,
  reason?: string,
) {
  return axios.post(
    `${ipNR}/workschedule/schedule/requests/${encodeURIComponent(id)}/reject`,
    { reason },
    getAuthHeader(token),
  );
}

export async function approveManySchedules(token: string, ids: string[]) {
  return axios.post(
    `${ipNR}/workschedule/schedule/requests/bulk-approve`,
    { ids },
    getAuthHeader(token),
  );
}

export async function getScheduleHeatmap(token: string, week?: string) {
  return axios.get<{ data: AdminHeatmapRow[] }>(
    `${ipNR}/workschedule/schedule/heatmap`,
    {
      ...getAuthHeader(token),
      params: week ? { week } : {},
    },
  );
}

export async function generateAttendanceQr(token: string) {
  return axios.post<{ data: { token: string; expires_at?: string } }>(
    `${ipNR}/workschedule/attendance/qr/generate`,
    {},
    getAuthHeader(token),
  );
}

export async function getTodayAttendance(token: string) {
  return axios.get<{ data: AdminAttendanceRecord[] }>(
    `${ipNR}/workschedule/attendance/today`,
    getAuthHeader(token),
  );
}

export async function getAttendanceReport(
  token: string,
  params: WorkscheduleQuery = {},
) {
  return axios.get<{ data: AdminAttendanceRecord[] }>(
    `${ipNR}/workschedule/attendance/report`,
    { ...getAuthHeader(token), params },
  );
}

export async function updateAdminSchedule(
  token: string,
  id: string,
  entries: { date: string; type: string; note?: string }[],
) {
  return axios.patch(
    `${ipNR}/workschedule/schedule/requests/${encodeURIComponent(id)}`,
    { entries },
    getAuthHeader(token),
  );
}

export async function scanAttendance(token: string, qrToken: string) {
  return axios.post<AttendanceScanResponse>(
    `${ipNR}/workschedule/attendance/scan`,
    { token: qrToken },
    getAuthHeader(token),
  );
}
