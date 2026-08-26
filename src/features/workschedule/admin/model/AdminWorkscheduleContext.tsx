import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { AppAlert as Alert } from "@/src/shared/ui/AppAlert";
import { useAuthSession } from "@/src/features/auth/model/AuthSessionContext";
import {
  AdminAttendanceRecord,
  AdminEmployeeProfile,
  AdminHeatmapRow,
  AdminScheduleRequest,
  useWorkscheduleAdmin,
} from "@/src/features/workschedule/admin/hooks/useWorkscheduleAdmin";
import type {
  EntryType,
  IWorkPolicy,
  WorkPeriod,
} from "@/src/services/workschedule/constant";
import { canManageWorkSchedule } from "@/src/application/access/roles";
import { toLocalDateKey } from "@/src/features/workschedule/shared/utils/date";

type RequestStatus = "all" | "pending" | "approved" | "rejected";
type ReportRange = "7d" | "30d";

type TodayExpectedItem = {
  requestId: string;
  employeeId: string;
  employee: AdminEmployeeProfile | null;
  entryDate: string;
  entryType: string;
};

// Utilities
const startOfDay = (date: Date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const addDays = (date: Date, offset: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + offset);
  return result;
};

const getIsoWeekMonday = (date: Date) => {
  const result = startOfDay(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  return result;
};

const getIsoWeekString = (date: Date) => {
  const current = startOfDay(date);
  current.setDate(current.getDate() + 3 - ((current.getDay() + 6) % 7));
  const firstThursday = new Date(current.getFullYear(), 0, 4);
  const weekNumber =
    1 +
    Math.round(
      ((current.getTime() - firstThursday.getTime()) / 86400000 -
        3 +
        ((firstThursday.getDay() + 6) % 7)) /
        7,
    );
  return `${current.getFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
};

const getReportRange = (range: ReportRange) => {
  const to = startOfDay(new Date());
  const from = new Date(to);
  from.setDate(from.getDate() - (range === "7d" ? 6 : 29));
  return {
    from: toLocalDateKey(from),
    to: toLocalDateKey(to),
  };
};

const isPhysicalAttendance = (record: AdminAttendanceRecord) =>
  record.source === "qr" &&
  record.schedule_type === "office" &&
  Boolean(record.check_in_at);

const formatDateString = (dateVal: string | Date | undefined | null) => {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
};

export interface AdminContextValue {
  appLoading: boolean;
  initialLoading: boolean;
  refreshing: boolean;
  user: any;
  
  // Policy
  policy: IWorkPolicy | null;
  policyDraft: { registration_start: string; registration_end: string; locked: boolean; };
  setPolicyDraft: React.Dispatch<React.SetStateAction<{ registration_start: string; registration_end: string; locked: boolean; }>>;
  savingPolicy: boolean;
  handleSavePolicy: () => Promise<void>;
  handleLockPolicy: () => Promise<void>;

  // Week selection
  currentWeek: string;
  selectedWeekOffset: number;
  setSelectedWeekOffset: React.Dispatch<React.SetStateAction<number>>;
  selectedWeek: string;
  selectedWeekLabel: string;

  // Requests
  pendingSchedules: AdminScheduleRequest[];
  allSchedules: AdminScheduleRequest[];
  requestFilter: RequestStatus;
  setRequestFilter: React.Dispatch<React.SetStateAction<RequestStatus>>;
  selectedPendingIds: string[];
  togglePendingSelection: (id: string) => void;
  handleApprove: (id: string) => Promise<void>;
  handleBulkApprove: () => Promise<void>;
  handleReject: (id: string) => Promise<void>;
  handleDelete: (id: string) => Promise<boolean>;
  rejectingRequestId: string | null;
  setRejectingRequestId: React.Dispatch<React.SetStateAction<string | null>>;
  rejectReason: string;
  setRejectReason: React.Dispatch<React.SetStateAction<string>>;
  busyRequestId: string | null;
  bulkBusy: boolean;

  // QR
  qrBusy: boolean;
  generatedQr: { token: string; expires_at?: string } | null;
  qrRemaining: number;
  handleGenerateQr: () => Promise<void>;

  // Attendance
  todayAttendance: AdminAttendanceRecord[];
  todayExpected: TodayExpectedItem[];
  missingToday: TodayExpectedItem[];
  checkedInMap: Map<string, AdminAttendanceRecord>;
  totalTodayExpected: number;
  totalTodayCheckedIn: number;
  totalTodayMissing: number;

  // Reports & Heatmap
  reportRows: AdminAttendanceRecord[];
  reportRange: ReportRange;
  setReportRange: React.Dispatch<React.SetStateAction<ReportRange>>;
  totalReportEmployees: number;
  totalReportCompleted: number;
  heatmapRows: AdminHeatmapRow[];

  // Actions
  loadAdminData: (showRefreshing?: boolean) => Promise<void>;
  handleAdminUpdateEntries: (
    id: string,
    entries: { date: string; type: EntryType; period?: WorkPeriod; note?: string }[],
  ) => Promise<boolean>;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { loading: appLoading, user } = useAuthSession();
  const {
    getPolicy,
    getPendingSchedules,
    getAllSchedules,
    getScheduleDetail,
    approveRequest,
    bulkApprove,
    rejectRequest,
    getHeatmap,
    generateQrToken,
    getTodayAttendance,
    getReport,
    updatePolicy,
    adminUpdateEntries,
    deleteRequest,
  } = useWorkscheduleAdmin();

  const currentWeek = useMemo(() => getIsoWeekString(new Date()), []);
  const [selectedWeekOffset, setSelectedWeekOffset] = useState(0);
  const selectedWeek = useMemo(
    () => getIsoWeekString(addDays(getIsoWeekMonday(new Date()), selectedWeekOffset * 7)),
    [selectedWeekOffset]
  );
  const selectedWeekLabel = useMemo(
    () => getIsoWeekMonday(addDays(getIsoWeekMonday(new Date()), selectedWeekOffset * 7)).toLocaleDateString("vi-VN"),
    [selectedWeekOffset]
  );

  const [policyDraft, setPolicyDraft] = useState({
    registration_start: "",
    registration_end: "",
    locked: true,
  });
  const [policy, setPolicy] = useState<IWorkPolicy | null>(null);

  const [pendingSchedules, setPendingSchedules] = useState<AdminScheduleRequest[]>([]);
  const [allSchedules, setAllSchedules] = useState<AdminScheduleRequest[]>([]);
  const [heatmapRows, setHeatmapRows] = useState<AdminHeatmapRow[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AdminAttendanceRecord[]>([]);
  const [reportRows, setReportRows] = useState<AdminAttendanceRecord[]>([]);
  const [todayExpected, setTodayExpected] = useState<TodayExpectedItem[]>([]);

  const [requestFilter, setRequestFilter] = useState<RequestStatus>("pending");
  const [reportRange, setReportRange] = useState<ReportRange>("7d");
  const [selectedPendingIds, setSelectedPendingIds] = useState<string[]>([]);
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [qrBusy, setQrBusy] = useState(false);
  const [generatedQr, setGeneratedQr] = useState<{ token: string; expires_at?: string } | null>(null);
  const [qrRemaining, setQrRemaining] = useState(0);

  const loadAdminData = useCallback(async (showRefreshing = false) => {
    if (!user || !canManageWorkSchedule(user.role)) return;

    if (showRefreshing) setRefreshing(true);

    const reportWindow = getReportRange(reportRange);
    const [
      policyData,
      pendingData,
      allData,
      heatmapData,
      attendanceData,
      reportData,
    ] = await Promise.all([
      getPolicy(true),
      getPendingSchedules(undefined, true),
      getAllSchedules({ week: selectedWeek, status: requestFilter }, true),
      getHeatmap(selectedWeek, true),
      getTodayAttendance(true),
      getReport(reportWindow, true),
    ]);

    const approvedCurrentWeek = await getAllSchedules({ week: currentWeek, status: "approved" }, true);
    const approvedDetails = await Promise.all(
      approvedCurrentWeek.map((request) => getScheduleDetail(request._id, true))
    );

    const todayKey = toLocalDateKey(new Date());
    const expected = approvedDetails.filter(Boolean).flatMap((request) => {
      const item = request as AdminScheduleRequest;
      const employeeId = String(item.employee?._id || item.employee?.id || item.employee_id || item._id);
      return (item.entries || [])
        .filter((entry) => entry.date.startsWith(todayKey) && entry.type === "office")
        .map((entry) => ({
          requestId: item._id,
          employeeId,
          employee: item.employee || null,
          entryDate: entry.date,
          entryType: entry.type,
        }));
    });

    setPolicy(policyData);
    if (policyData) {
      setPolicyDraft({
        registration_start: formatDateString(policyData.registration_start),
        registration_end: formatDateString(policyData.registration_end),
        locked: policyData.locked ?? true,
      });
    }
    setPendingSchedules(pendingData);
    setAllSchedules(allData);
    setHeatmapRows(heatmapData);
    setTodayAttendance(attendanceData.filter(isPhysicalAttendance));
    setReportRows(reportData.filter(isPhysicalAttendance));
    setTodayExpected(expected);
    setSelectedPendingIds((previous) =>
      previous.filter((id) => allData.some((request) => request._id === id && request.status === "pending")),
    );
    setInitialLoading(false);

    if (showRefreshing) setRefreshing(false);
  }, [
    currentWeek, getPolicy, getPendingSchedules, getAllSchedules, getHeatmap, getTodayAttendance, getReport, getScheduleDetail, requestFilter, reportRange, selectedWeek, user
  ]);

  useEffect(() => {
    if (!generatedQr?.expires_at) {
      setQrRemaining(0);
      return;
    }

    const tick = () => {
      const expiresAt = new Date(generatedQr.expires_at || "").getTime();
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setQrRemaining(remaining);
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [generatedQr]);

  const checkedInMap = useMemo(() => {
    const map = new Map<string, AdminAttendanceRecord>();
    todayAttendance.forEach((item) => {
      map.set(String(item.employee?._id || item.employee_id), item);
    });
    return map;
  }, [todayAttendance]);

  const missingToday = useMemo(() => {
    return todayExpected.filter((item) => !checkedInMap.has(item.employeeId));
  }, [checkedInMap, todayExpected]);

  const handleSavePolicy = async () => {
    const startStr = policyDraft.registration_start.trim();
    const endStr = policyDraft.registration_end.trim();

    // Regex check for YYYY-MM-DD HH:mm
    const dateRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;
    if (!dateRegex.test(startStr) || !dateRegex.test(endStr)) {
      Alert.alert("Lỗi", "Thời gian phải có định dạng YYYY-MM-DD HH:mm (Ví dụ: 2026-05-22 17:00)");
      return;
    }

    const start = new Date(startStr);
    const end = new Date(endStr);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      Alert.alert("Lỗi", "Ngày giờ nhập vào không hợp lệ");
      return;
    }

    if (start >= end) {
      Alert.alert("Lỗi", "Thời gian bắt đầu phải trước thời gian kết thúc");
      return;
    }

    const payload = {
      registration_start: start.toISOString(),
      registration_end: end.toISOString(),
      locked: policyDraft.locked,
    };

    setSavingPolicy(true);
    const updated = await updatePolicy(payload);
    setSavingPolicy(false);

    if (updated) {
      setPolicy(updated);
      setPolicyDraft({
        registration_start: formatDateString(updated.registration_start),
        registration_end: formatDateString(updated.registration_end),
        locked: updated.locked ?? true,
      });
      Alert.alert("Thành công", "Đã cập nhật chính sách làm việc");
    }
  };

  const handleLockPolicy = async () => {
    if (!policy) return;
    setSavingPolicy(true);
    const updated = await updatePolicy({
      registration_start: policy.registration_start,
      registration_end: policy.registration_end,
      locked: true,
    });
    setSavingPolicy(false);
    if (updated) {
      setPolicy(updated);
      setPolicyDraft({
        registration_start: formatDateString(updated.registration_start),
        registration_end: formatDateString(updated.registration_end),
        locked: true,
      });
      Alert.alert("Đã cập nhật", "Đã tạm dừng nhận đăng ký lịch làm việc");
    }
  };

  const handleApprove = async (id: string) => {
    setBusyRequestId(id);
    const success = await approveRequest(id);
    setBusyRequestId(null);
    if (success) await loadAdminData();
  };

  const handleBulkApprove = async () => {
    if (selectedPendingIds.length === 0) {
      Alert.alert("Thông báo", "Hãy chọn ít nhất một request cần duyệt");
      return;
    }

    setBulkBusy(true);
    const success = await bulkApprove(selectedPendingIds);
    setBulkBusy(false);
    if (success) {
      setSelectedPendingIds([]);
      await loadAdminData();
    }
  };

  const handleReject = async (id: string) => {
    const reason = rejectReason.trim();
    if (!reason) {
      Alert.alert("Thiếu lý do", "Vui lòng nhập lý do từ chối để nhân viên có thể xem lại.");
      return;
    }
    setBusyRequestId(id);
    const success = await rejectRequest(id, reason);
    setBusyRequestId(null);
    if (success) {
      setRejectingRequestId(null);
      setRejectReason("");
      await loadAdminData();
    }
  };

  const handleAdminUpdateEntries = async (
    id: string,
    entries: { date: string; type: EntryType; period?: WorkPeriod; note?: string }[],
  ) => {
    setBusyRequestId(id);
    const success = await adminUpdateEntries(id, entries);
    setBusyRequestId(null);
    if (success) {
      await loadAdminData();
    }
    return success;
  };

  const handleDelete = async (id: string) => {
    setBusyRequestId(id);
    const success = await deleteRequest(id);
    setBusyRequestId(null);
    if (success) {
      setSelectedPendingIds((previous) =>
        previous.filter((requestId) => requestId !== id),
      );
      await loadAdminData();
      Alert.alert("Đã xóa", "Yêu cầu lịch làm việc đã được xóa khỏi hệ thống.");
    }
    return success;
  };

  const handleGenerateQr = async () => {
    setQrBusy(true);
    const token = await generateQrToken();
    setQrBusy(false);
    if (token) {
      setGeneratedQr(token);
      Alert.alert(
        "Đã tạo QR",
        "Mã dùng chung cho nhiều nhân viên và có hiệu lực trong 30 giây. Hãy tạo mã mới cho đợt check-in và một mã khác cho đợt check-out.",
      );
    }
  };

  const togglePendingSelection = (id: string) => {
    setSelectedPendingIds((previous) => previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]);
  };

  const totalTodayExpected = todayExpected.length;
  const totalTodayCheckedIn = todayAttendance.length;
  const totalTodayMissing = missingToday.length;
  const totalReportEmployees = new Set(reportRows.map((item) => String(item.employee?._id || item.employee_id))).size;
  const totalReportCompleted = reportRows.filter((item) => item.check_out_at).length;

  const value: AdminContextValue = {
    appLoading, initialLoading, refreshing, user,
    policy, policyDraft, setPolicyDraft, savingPolicy, handleSavePolicy, handleLockPolicy,
    currentWeek, selectedWeekOffset, setSelectedWeekOffset, selectedWeek, selectedWeekLabel,
    pendingSchedules, allSchedules, requestFilter, setRequestFilter, selectedPendingIds, togglePendingSelection,
    handleApprove, handleBulkApprove, handleReject, handleDelete, rejectingRequestId, setRejectingRequestId, rejectReason, setRejectReason, busyRequestId, bulkBusy,
    qrBusy, generatedQr, qrRemaining, handleGenerateQr,
    todayAttendance, todayExpected, missingToday, checkedInMap, totalTodayExpected, totalTodayCheckedIn, totalTodayMissing,
    reportRows, reportRange, setReportRange, totalReportEmployees, totalReportCompleted, heatmapRows,
    loadAdminData, handleAdminUpdateEntries
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdminData() {
  const context = useContext(AdminContext);
  if (!context) throw new Error("useAdminData must be used within an AdminProvider");
  return context;
}
