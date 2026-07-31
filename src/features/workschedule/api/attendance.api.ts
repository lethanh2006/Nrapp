import { apiClient } from "@/src/shared/api/http-client";
import { WORKSCHEDULE_ENDPOINTS } from "@/src/features/workschedule/api/workschedule.endpoints";

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
    apiClient.post<AttendanceScanResponse>(
      WORKSCHEDULE_ENDPOINTS.attendanceScan,
      { token },
    ),
};
