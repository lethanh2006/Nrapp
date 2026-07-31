/**
 * Backend paths grouped by feature and access area. Feature services should
 * consume these constants instead of embedding paths in screen components.
 */
export const API_ENDPOINTS = {
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    verifyOtp: "/auth/verify",
  },
  user: {
    profile: "/user/me",
    all: "/user/user/all",
  },
  chat: {
    all: "/chat/chat/all",
    create: "/chat/chat/new",
    message: "/chat/message",
    messages: (chatId: string) => `/chat/message/${encodeURIComponent(chatId)}`,
  },
  todo: {
    admin: {
      all: "/",
      assign: (taskId: string) => `/${encodeURIComponent(taskId)}/assign`,
      status: (taskId: string) => `/${encodeURIComponent(taskId)}/status`,
      detail: (taskId: string) => `/${encodeURIComponent(taskId)}`,
    },
    user: {
      mine: "/my-tasks",
      status: (taskId: string) => `/${encodeURIComponent(taskId)}/status`,
    },
  },
  workschedule: {
    policy: "/policy",
    mySchedules: "/schedule/my",
    requests: "/schedule/requests",
    request: (id: string) => `/schedule/requests/${encodeURIComponent(id)}`,
    submitRequest: (id: string) =>
      `/schedule/requests/${encodeURIComponent(id)}/submit`,
    attendanceScan: "/attendance/scan",
    admin: {
      policy: "/policy",
      pendingSchedules: "/schedule/pending",
      allSchedules: "/schedule/all",
      approve: (id: string) =>
        `/schedule/requests/${encodeURIComponent(id)}/approve`,
      reject: (id: string) =>
        `/schedule/requests/${encodeURIComponent(id)}/reject`,
      bulkApprove: "/schedule/requests/bulk-approve",
      heatmap: "/schedule/heatmap",
      generateQr: "/attendance/qr/generate",
      todayAttendance: "/attendance/today",
      attendanceReport: "/attendance/report",
    },
  },
} as const;
