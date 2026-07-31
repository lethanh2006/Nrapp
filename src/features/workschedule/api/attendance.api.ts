import { workscheduleClient } from "@/src/api/client";
import { API_ENDPOINTS } from "@/src/api/endpoints";

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

export const attendanceApi = {
  scan: (token: string) =>
    workscheduleClient.post<AttendanceScanResponse>(
      API_ENDPOINTS.workschedule.attendanceScan,
      { token },
    ),
};
