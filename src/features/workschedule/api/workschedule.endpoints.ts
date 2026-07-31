export const WORKSCHEDULE_ENDPOINTS = {
  policy: "/policy",
  mySchedules: "/schedule/my",
  requests: "/schedule/requests",
  request: (id: string) => `/schedule/requests/${encodeURIComponent(id)}`,
  submitRequest: (id: string) =>
    `/schedule/requests/${encodeURIComponent(id)}/submit`,
  attendanceScan: "/workschedule/attendance/scan",
  admin: {
    policy: "/admin/policy",
    pendingSchedules: "/admin/schedule/pending",
    allSchedules: "/admin/schedule/all",
    approve: (id: string) =>
      `/admin/schedule/${encodeURIComponent(id)}/approve`,
    reject: (id: string) =>
      `/admin/schedule/${encodeURIComponent(id)}/reject`,
    bulkApprove: "/admin/schedule/bulk-approve",
    heatmap: "/admin/schedule/heatmap",
    generateQr: "/admin/attendance/qr/generate",
    todayAttendance: "/admin/attendance/today",
    attendanceReport: "/admin/attendance/report",
  },
} as const;
