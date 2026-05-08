import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { Alert } from "react-native";
import { useAppData } from "@/context/AppContext";
import {
  AdminAttendanceRecord,
  AdminEmployeeProfile,
  AdminHeatmapRow,
  AdminScheduleRequest,
  useWorkscheduleAdmin,
} from "@/hooks/useWorkscheduleAdmin";
import { IWorkPolicy } from "@/components/workschedule/types";

type RequestStatus = "all" | "draft" | "pending" | "approved" | "rejected";
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
    from: from.toISOString(),
    to: addDays(to, 1).toISOString(),
  };
};

export interface AdminContextValue {
  appLoading: boolean;
  initialLoading: boolean;
  refreshing: boolean;
  user: any;
  
  // Policy
  policy: IWorkPolicy | null;
  policyDraft: { submit_deadline_day: string; submit_deadline_hour: string; lock_schedule_days: string; };
  setPolicyDraft: React.Dispatch<React.SetStateAction<{ submit_deadline_day: string; submit_deadline_hour: string; lock_schedule_days: string; }>>;
  savingPolicy: boolean;
  handleSavePolicy: () => Promise<void>;

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
  totalReportRemote: number;
  heatmapRows: AdminHeatmapRow[];

  // Actions
  loadAdminData: (showRefreshing?: boolean) => Promise<void>;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { loading: appLoading, user } = useAppData();
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
    updatePolicy
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
    submit_deadline_day: "5",
    submit_deadline_hour: "17",
    lock_schedule_days: "7",
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
    if (!user || user.role !== "admin") return;

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
      getPendingSchedules(selectedWeek, true),
      getAllSchedules({ week: selectedWeek, status: requestFilter }, true),
      getHeatmap(selectedWeek, true),
      getTodayAttendance(true),
      getReport(reportWindow, true),
    ]);

    const approvedCurrentWeek = await getAllSchedules({ week: currentWeek, status: "approved" }, true);
    const approvedDetails = await Promise.all(
      approvedCurrentWeek.map((request) => getScheduleDetail(request._id, true))
    );

    const todayKey = startOfDay(new Date()).toISOString().split("T")[0];
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
        submit_deadline_day: String(policyData.submit_deadline_day ?? 5),
        submit_deadline_hour: String(policyData.submit_deadline_hour ?? 17),
        lock_schedule_days: String(policyData.lock_schedule_days ?? 7),
      });
    }
    setPendingSchedules(pendingData);
    setAllSchedules(allData);
    setHeatmapRows(heatmapData);
    setTodayAttendance(attendanceData);
    setReportRows(reportData);
    setTodayExpected(expected);
    setSelectedPendingIds((previous) => previous.filter((id) => pendingData.some((req) => req._id === id)));
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
    const payload = {
      submit_deadline_day: Number(policyDraft.submit_deadline_day),
      submit_deadline_hour: Number(policyDraft.submit_deadline_hour),
      lock_schedule_days: Number(policyDraft.lock_schedule_days),
    };

    if (!Number.isFinite(payload.submit_deadline_day) || !Number.isFinite(payload.submit_deadline_hour) || !Number.isFinite(payload.lock_schedule_days)) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ giá trị số hợp lệ cho chính sách");
      return;
    }

    setSavingPolicy(true);
    const updated = await updatePolicy(payload);
    setSavingPolicy(false);

    if (updated) {
      setPolicy(updated);
      setPolicyDraft({
        submit_deadline_day: String(updated.submit_deadline_day),
        submit_deadline_hour: String(updated.submit_deadline_hour),
        lock_schedule_days: String(updated.lock_schedule_days),
      });
      Alert.alert("Thành công", "Đã cập nhật chính sách làm việc");
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
    setBusyRequestId(id);
    const success = await rejectRequest(id, rejectReason.trim() || "Từ chối bởi quản trị viên");
    setBusyRequestId(null);
    if (success) {
      setRejectingRequestId(null);
      setRejectReason("");
      await loadAdminData();
    }
  };

  const handleGenerateQr = async () => {
    setQrBusy(true);
    const token = await generateQrToken();
    setQrBusy(false);
    if (token) {
      setGeneratedQr(token);
      Alert.alert("Đã tạo QR", "Token chấm công có hiệu lực trong 30 giây");
    }
  };

  const togglePendingSelection = (id: string) => {
    setSelectedPendingIds((previous) => previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]);
  };

  const totalTodayExpected = todayExpected.length;
  const totalTodayCheckedIn = todayAttendance.length;
  const totalTodayMissing = missingToday.length;
  const totalReportEmployees = new Set(reportRows.map((item) => String(item.employee?._id || item.employee_id))).size;
  const totalReportRemote = reportRows.filter((item) => item.schedule_type === "remote").length;

  const value: AdminContextValue = {
    appLoading, initialLoading, refreshing, user,
    policy, policyDraft, setPolicyDraft, savingPolicy, handleSavePolicy,
    currentWeek, selectedWeekOffset, setSelectedWeekOffset, selectedWeek, selectedWeekLabel,
    pendingSchedules, allSchedules, requestFilter, setRequestFilter, selectedPendingIds, togglePendingSelection,
    handleApprove, handleBulkApprove, handleReject, rejectingRequestId, setRejectingRequestId, rejectReason, setRejectReason, busyRequestId, bulkBusy,
    qrBusy, generatedQr, qrRemaining, handleGenerateQr,
    todayAttendance, todayExpected, missingToday, checkedInMap, totalTodayExpected, totalTodayCheckedIn, totalTodayMissing,
    reportRows, reportRange, setReportRange, totalReportEmployees, totalReportRemote, heatmapRows,
    loadAdminData
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdminData() {
  const context = useContext(AdminContext);
  if (!context) throw new Error("useAdminData must be used within an AdminProvider");
  return context;
}
