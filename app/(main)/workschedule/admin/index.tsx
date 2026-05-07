import { useAppData } from "@/context/AppContext";
import {
  AdminAttendanceRecord,
  AdminEmployeeProfile,
  AdminHeatmapRow,
  AdminScheduleRequest,
  useWorkscheduleAdmin,
} from "@/hooks/useWorkscheduleAdmin";
import { IWorkPolicy } from "@/components/workschedule/types";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

type RequestStatus = "all" | "draft" | "pending" | "approved" | "rejected";
type ReportRange = "7d" | "30d";

type TodayExpectedItem = {
  requestId: string;
  employeeId: string;
  employee: AdminEmployeeProfile | null;
  entryDate: string;
  entryType: string;
};

const requestStatusLabels: Record<RequestStatus, string> = {
  all: "Tất cả",
  draft: "Nháp",
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
};

const entryLabels: Record<string, string> = {
  office: "Lên công ty",
  remote: "Từ xa",
  day_off: "Nghỉ",
  leave: "Phép",
};

const statusStyle: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-800",
};

const formatEmployee = (
  employee?: AdminEmployeeProfile | null,
  fallback = "Không rõ",
) => {
  if (!employee) return fallback;
  return employee.username || employee.name || employee.email || fallback;
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("vi-VN");
};

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("vi-VN");
};

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

const getEntryColor = (type: string) => {
  const base = {
    office: "bg-blue-50 border-blue-200 text-blue-900",
    remote: "bg-violet-50 border-violet-200 text-violet-900",
    day_off: "bg-slate-50 border-slate-200 text-slate-900",
    leave: "bg-amber-50 border-amber-200 text-amber-900",
  } as Record<string, string>;
  return base[type] || base.office;
};

export default function WorkscheduleAdminScreen() {
  const { loading: appLoading, user } = useAppData();
  const {
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
  } = useWorkscheduleAdmin();

  const currentWeek = useMemo(() => getIsoWeekString(new Date()), []);
  const [selectedWeekOffset, setSelectedWeekOffset] = useState(0);
  const selectedWeek = useMemo(
    () =>
      getIsoWeekString(
        addDays(getIsoWeekMonday(new Date()), selectedWeekOffset * 7),
      ),
    [selectedWeekOffset],
  );
  const selectedWeekLabel = useMemo(
    () =>
      getIsoWeekMonday(
        addDays(getIsoWeekMonday(new Date()), selectedWeekOffset * 7),
      ).toLocaleDateString("vi-VN"),
    [selectedWeekOffset],
  );

  const [policyDraft, setPolicyDraft] = useState({
    submit_deadline_day: "5",
    submit_deadline_hour: "17",
    lock_schedule_days: "7",
  });
  const [policy, setPolicy] = useState<IWorkPolicy | null>(null);

  const [pendingSchedules, setPendingSchedules] = useState<
    AdminScheduleRequest[]
  >([]);
  const [allSchedules, setAllSchedules] = useState<AdminScheduleRequest[]>([]);
  const [heatmapRows, setHeatmapRows] = useState<AdminHeatmapRow[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<
    AdminAttendanceRecord[]
  >([]);
  const [reportRows, setReportRows] = useState<AdminAttendanceRecord[]>([]);
  const [todayExpected, setTodayExpected] = useState<TodayExpectedItem[]>([]);

  const [requestFilter, setRequestFilter] = useState<RequestStatus>("pending");
  const [reportRange, setReportRange] = useState<ReportRange>("7d");
  const [selectedPendingIds, setSelectedPendingIds] = useState<string[]>([]);
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(
    null,
  );
  const [rejectReason, setRejectReason] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [qrBusy, setQrBusy] = useState(false);
  const [generatedQr, setGeneratedQr] = useState<{
    token: string;
    expires_at?: string;
  } | null>(null);
  const [qrRemaining, setQrRemaining] = useState(0);

  const loadAdminData = useCallback(
    async (showRefreshing = false) => {
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

      const approvedCurrentWeek = await getAllSchedules(
        { week: currentWeek, status: "approved" },
        true,
      );
      const approvedDetails = await Promise.all(
        approvedCurrentWeek.map((request) =>
          getScheduleDetail(request._id, true),
        ),
      );

      const todayKey = startOfDay(new Date()).toISOString().split("T")[0];
      const expected = approvedDetails.filter(Boolean).flatMap((request) => {
        const item = request as AdminScheduleRequest;
        const employeeId = String(
          item.employee?._id ||
            item.employee?.id ||
            item.employee_id ||
            item._id,
        );
        return (item.entries || [])
          .filter(
            (entry) =>
              entry.date.startsWith(todayKey) && entry.type === "office",
          )
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
      setSelectedPendingIds((previous) =>
        previous.filter((id) =>
          pendingData.some((request) => request._id === id),
        ),
      );
      setInitialLoading(false);

      if (showRefreshing) setRefreshing(false);
    },
    [
      currentWeek,
      getAllSchedules,
      getHeatmap,
      getPolicy,
      getPendingSchedules,
      getReport,
      getScheduleDetail,
      getTodayAttendance,
      requestFilter,
      reportRange,
      selectedWeek,
      user,
    ],
  );

  useFocusEffect(
    useCallback(() => {
      loadAdminData();
    }, [loadAdminData]),
  );

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

  const handleRefresh = async () => {
    await loadAdminData(true);
  };

  const handleSavePolicy = async () => {
    const payload = {
      submit_deadline_day: Number(policyDraft.submit_deadline_day),
      submit_deadline_hour: Number(policyDraft.submit_deadline_hour),
      lock_schedule_days: Number(policyDraft.lock_schedule_days),
    };

    if (
      !Number.isFinite(payload.submit_deadline_day) ||
      !Number.isFinite(payload.submit_deadline_hour) ||
      !Number.isFinite(payload.lock_schedule_days)
    ) {
      Alert.alert(
        "Lỗi",
        "Vui lòng nhập đầy đủ giá trị số hợp lệ cho chính sách",
      );
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
    if (success) {
      await loadAdminData();
    }
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
    const success = await rejectRequest(
      id,
      rejectReason.trim() || "Từ chối bởi quản trị viên",
    );
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
    setSelectedPendingIds((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id],
    );
  };

  const totalTodayExpected = todayExpected.length;
  const totalTodayCheckedIn = todayAttendance.length;
  const totalTodayMissing = missingToday.length;
  const totalReportEmployees = new Set(
    reportRows.map((item) => String(item.employee?._id || item.employee_id)),
  ).size;
  const totalReportRemote = reportRows.filter(
    (item) => item.schedule_type === "remote",
  ).length;

  if (appLoading || initialLoading) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#f8fafc" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-slate-950"
      contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#f8fafc"
        />
      }
    >
      <View className="bg-slate-900 rounded-3xl p-5 border border-slate-700">
        <View className="flex-row items-start justify-between gap-4">
          <View className="flex-1">
            <Text className="text-xs uppercase tracking-[3px] text-cyan-200">
              Workschedule Admin
            </Text>
            <Text className="text-3xl font-bold text-white mt-2">
              Quản trị lịch làm việc
            </Text>
            <Text className="text-slate-300 mt-2 leading-5">
              Quản lý chính sách, duyệt lịch, tạo QR chấm công và theo dõi báo
              cáo trong cùng một luồng.
            </Text>
          </View>
          <View className="bg-white/10 rounded-2xl px-3 py-2 border border-white/10">
            <Text className="text-cyan-100 text-xs uppercase tracking-[2px]">
              Role
            </Text>
            <Text className="text-white font-semibold mt-1">
              {user?.role || "admin"}
            </Text>
          </View>
        </View>

        <View className="flex-row flex-wrap mt-5" style={{ gap: 10 }}>
          <View className="bg-white/10 rounded-2xl px-4 py-3 border border-white/10 min-w-[110px]">
            <Text className="text-slate-300 text-xs">Chờ duyệt</Text>
            <Text className="text-white text-2xl font-bold mt-1">
              {pendingSchedules.length}
            </Text>
          </View>
          <View className="bg-white/10 rounded-2xl px-4 py-3 border border-white/10 min-w-[110px]">
            <Text className="text-slate-300 text-xs">Đã check-in</Text>
            <Text className="text-white text-2xl font-bold mt-1">
              {totalTodayCheckedIn}
            </Text>
          </View>
          <View className="bg-white/10 rounded-2xl px-4 py-3 border border-white/10 min-w-[110px]">
            <Text className="text-slate-300 text-xs">Thiếu hôm nay</Text>
            <Text className="text-white text-2xl font-bold mt-1">
              {totalTodayMissing}
            </Text>
          </View>
          <View className="bg-white/10 rounded-2xl px-4 py-3 border border-white/10 min-w-[110px]">
            <Text className="text-slate-300 text-xs">Báo cáo</Text>
            <Text className="text-white text-2xl font-bold mt-1">
              {reportRows.length}
            </Text>
          </View>
        </View>
      </View>

      <View className="bg-white rounded-3xl p-5 border border-slate-200">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-lg font-bold text-slate-900">
              Chính sách làm việc
            </Text>
            <Text className="text-slate-500 mt-1">
              Cấu hình deadline nộp lịch và số ngày khóa lịch.
            </Text>
          </View>
          <View className="bg-slate-100 rounded-full px-3 py-1">
            <Text className="text-slate-700 text-xs font-semibold">
              {policy ? "Đang áp dụng" : "Mặc định"}
            </Text>
          </View>
        </View>

        <View className="flex-row flex-wrap" style={{ gap: 12 }}>
          <View className="flex-1 min-w-[130px]">
            <Text className="text-slate-600 text-xs mb-2">Ngày deadline</Text>
            <TextInput
              value={policyDraft.submit_deadline_day}
              onChangeText={(text) =>
                setPolicyDraft((previous) => ({
                  ...previous,
                  submit_deadline_day: text,
                }))
              }
              keyboardType="number-pad"
              className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900"
              placeholder="5"
            />
          </View>
          <View className="flex-1 min-w-[130px]">
            <Text className="text-slate-600 text-xs mb-2">Giờ deadline</Text>
            <TextInput
              value={policyDraft.submit_deadline_hour}
              onChangeText={(text) =>
                setPolicyDraft((previous) => ({
                  ...previous,
                  submit_deadline_hour: text,
                }))
              }
              keyboardType="number-pad"
              className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900"
              placeholder="17"
            />
          </View>
          <View className="flex-1 min-w-[130px]">
            <Text className="text-slate-600 text-xs mb-2">Ngày khóa lịch</Text>
            <TextInput
              value={policyDraft.lock_schedule_days}
              onChangeText={(text) =>
                setPolicyDraft((previous) => ({
                  ...previous,
                  lock_schedule_days: text,
                }))
              }
              keyboardType="number-pad"
              className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900"
              placeholder="7"
            />
          </View>
        </View>

        <View className="flex-row flex-wrap mt-4" style={{ gap: 10 }}>
          <Pressable
            onPress={handleSavePolicy}
            disabled={savingPolicy}
            className={`flex-1 min-w-[150px] rounded-2xl py-3 items-center ${savingPolicy ? "bg-slate-300" : "bg-slate-900"}`}
          >
            <Text className="text-white font-semibold">
              {savingPolicy ? "Đang lưu..." : "Lưu chính sách"}
            </Text>
          </Pressable>
          <View className="flex-1 min-w-[150px] rounded-2xl py-3 px-4 bg-cyan-50 border border-cyan-100 justify-center">
            <Text className="text-cyan-900 text-xs uppercase tracking-[2px]">
              Current
            </Text>
            <Text className="text-cyan-950 font-semibold mt-1">
              Deadline ngày{" "}
              {policy?.submit_deadline_day ?? policyDraft.submit_deadline_day},{" "}
              {policy?.submit_deadline_hour ?? policyDraft.submit_deadline_hour}
              :00
            </Text>
          </View>
        </View>
      </View>

      <View className="bg-white rounded-3xl p-5 border border-slate-200">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-lg font-bold text-slate-900">
              Duyệt lịch chờ xử lý
            </Text>
            <Text className="text-slate-500 mt-1">
              Chọn nhiều request rồi duyệt hàng loạt, hoặc duyệt từng request.
            </Text>
          </View>
          <Pressable
            onPress={handleBulkApprove}
            disabled={bulkBusy || selectedPendingIds.length === 0}
            className={`rounded-2xl px-4 py-3 ${bulkBusy || selectedPendingIds.length === 0 ? "bg-emerald-200" : "bg-emerald-600"}`}
          >
            <Text className="text-white font-semibold">
              {bulkBusy
                ? "Đang duyệt..."
                : `Duyệt ${selectedPendingIds.length}`}
            </Text>
          </Pressable>
        </View>

        {pendingSchedules.length === 0 ? (
          <View className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <Text className="text-slate-500">
              Không có request chờ duyệt trong tuần này.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {pendingSchedules.map((request) => {
              const isSelected = selectedPendingIds.includes(request._id);
              const isRejecting = rejectingRequestId === request._id;
              return (
                <View
                  key={request._id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <View className="flex-row items-start justify-between gap-3">
                    <Pressable
                      onPress={() => togglePendingSelection(request._id)}
                      className={`w-6 h-6 rounded-full border items-center justify-center mt-1 ${isSelected ? "bg-slate-900 border-slate-900" : "border-slate-300 bg-white"}`}
                    >
                      {isSelected ? (
                        <Ionicons name="checkmark" size={14} color="#fff" />
                      ) : null}
                    </Pressable>

                    <View className="flex-1">
                      <Text className="text-base font-semibold text-slate-900">
                        {formatEmployee(request.employee, "Nhân viên")}
                      </Text>
                      <Text className="text-slate-600 mt-1">
                        Tuần: {formatDate(request.week_start)}
                      </Text>
                      <Text className="text-slate-600">
                        Nộp lúc: {formatDateTime(request.submitted_at)}
                      </Text>
                      {request.reject_reason ? (
                        <Text className="text-rose-700 mt-1">
                          Lý do từ chối: {request.reject_reason}
                        </Text>
                      ) : null}
                    </View>

                    <View
                      className={`rounded-full px-3 py-1 ${statusStyle[request.status] || statusStyle.pending}`}
                    >
                      <Text className="text-xs font-semibold uppercase">
                        {requestStatusLabels[request.status as RequestStatus] ||
                          request.status}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row mt-4" style={{ gap: 10 }}>
                    <Pressable
                      onPress={() => handleApprove(request._id)}
                      disabled={busyRequestId === request._id}
                      className={`flex-1 rounded-2xl py-3 items-center ${busyRequestId === request._id ? "bg-emerald-200" : "bg-emerald-600"}`}
                    >
                      <Text className="text-white font-semibold">
                        {busyRequestId === request._id
                          ? "Đang duyệt..."
                          : "Phê duyệt"}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setRejectingRequestId(isRejecting ? null : request._id);
                        setRejectReason("");
                      }}
                      className="flex-1 rounded-2xl py-3 items-center bg-rose-600"
                    >
                      <Text className="text-white font-semibold">Từ chối</Text>
                    </Pressable>
                  </View>

                  {isRejecting ? (
                    <View className="mt-4 gap-3">
                      <TextInput
                        value={rejectReason}
                        onChangeText={setRejectReason}
                        placeholder="Nhập lý do từ chối"
                        className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-slate-900"
                      />
                      <View className="flex-row" style={{ gap: 10 }}>
                        <Pressable
                          onPress={() => handleReject(request._id)}
                          disabled={busyRequestId === request._id}
                          className={`flex-1 rounded-2xl py-3 items-center ${busyRequestId === request._id ? "bg-rose-200" : "bg-rose-700"}`}
                        >
                          <Text className="text-white font-semibold">
                            Xác nhận từ chối
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            setRejectingRequestId(null);
                            setRejectReason("");
                          }}
                          className="flex-1 rounded-2xl py-3 items-center bg-slate-200"
                        >
                          <Text className="text-slate-700 font-semibold">
                            Hủy
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
      </View>

      <View className="bg-white rounded-3xl p-5 border border-slate-200">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-lg font-bold text-slate-900">
              Toàn bộ request
            </Text>
            <Text className="text-slate-500 mt-1">
              Lọc theo trạng thái để xem toàn bộ yêu cầu của tuần đang chọn.
            </Text>
          </View>
          <View className="bg-slate-100 rounded-full px-3 py-1">
            <Text className="text-slate-700 text-xs font-semibold">
              Tuần: {selectedWeekLabel}
            </Text>
          </View>
        </View>

        <View className="flex-row flex-wrap mb-4" style={{ gap: 8 }}>
          <Pressable
            onPress={() => setSelectedWeekOffset((previous) => previous - 1)}
            className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200"
          >
            <Text className="text-slate-700 font-semibold">Tuần trước</Text>
          </Pressable>
          <Pressable
            onPress={() => setSelectedWeekOffset(0)}
            className="px-3 py-2 rounded-xl bg-cyan-50 border border-cyan-100"
          >
            <Text className="text-cyan-800 font-semibold">Hiện tại</Text>
          </Pressable>
          <Pressable
            onPress={() => setSelectedWeekOffset((previous) => previous + 1)}
            className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200"
          >
            <Text className="text-slate-700 font-semibold">Tuần sau</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4"
        >
          <View className="flex-row" style={{ gap: 8 }}>
            {(Object.keys(requestStatusLabels) as RequestStatus[]).map(
              (status) => (
                <Pressable
                  key={status}
                  onPress={() => setRequestFilter(status)}
                  className={`px-4 py-2 rounded-full border ${requestFilter === status ? "bg-slate-900 border-slate-900" : "bg-white border-slate-200"}`}
                >
                  <Text
                    className={
                      requestFilter === status
                        ? "text-white font-semibold"
                        : "text-slate-700 font-semibold"
                    }
                  >
                    {requestStatusLabels[status]}
                  </Text>
                </Pressable>
              ),
            )}
          </View>
        </ScrollView>

        {allSchedules.length === 0 ? (
          <View className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <Text className="text-slate-500">
              Không có request phù hợp bộ lọc.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {allSchedules.map((request) => (
              <View
                key={request._id}
                className="rounded-2xl border border-slate-200 p-4 bg-slate-50"
              >
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-slate-900">
                      {formatEmployee(request.employee, "Nhân viên")}
                    </Text>
                    <Text className="text-slate-600 mt-1">
                      Tuần: {formatDate(request.week_start)}
                    </Text>
                    <Text className="text-slate-600">
                      Nộp lúc: {formatDateTime(request.submitted_at)}
                    </Text>
                    <Text className="text-slate-600">
                      Duyệt lúc: {formatDateTime(request.reviewed_at)}
                    </Text>
                    {request.reject_reason ? (
                      <Text className="text-rose-700 mt-1">
                        Lý do từ chối: {request.reject_reason}
                      </Text>
                    ) : null}
                  </View>
                  <View
                    className={`rounded-full px-3 py-1 ${statusStyle[request.status] || statusStyle.pending}`}
                  >
                    <Text className="text-xs font-semibold uppercase">
                      {requestStatusLabels[request.status as RequestStatus] ||
                        request.status}
                    </Text>
                  </View>
                </View>

                <View className="flex-row mt-3" style={{ gap: 8 }}>
                  <View className="flex-1 rounded-2xl bg-white border border-slate-200 px-3 py-2">
                    <Text className="text-slate-500 text-xs">Request ID</Text>
                    <Text
                      className="text-slate-900 font-semibold mt-1"
                      numberOfLines={1}
                    >
                      {request._id}
                    </Text>
                  </View>
                  <View className="flex-1 rounded-2xl bg-white border border-slate-200 px-3 py-2">
                    <Text className="text-slate-500 text-xs">Employee ID</Text>
                    <Text
                      className="text-slate-900 font-semibold mt-1"
                      numberOfLines={1}
                    >
                      {request.employee_id}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <View className="bg-white rounded-3xl p-5 border border-slate-200">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-lg font-bold text-slate-900">
              QR chấm công
            </Text>
            <Text className="text-slate-500 mt-1">
              Tạo token 30 giây cho nhân viên quét check-in.
            </Text>
          </View>
          <Pressable
            onPress={handleGenerateQr}
            disabled={qrBusy}
            className={`rounded-2xl px-4 py-3 ${qrBusy ? "bg-cyan-200" : "bg-cyan-600"}`}
          >
            <Text className="text-white font-semibold">
              {qrBusy ? "Đang tạo..." : "Tạo QR"}
            </Text>
          </Pressable>
        </View>

        {generatedQr ? (
          <View className="rounded-3xl border border-cyan-100 bg-cyan-50 p-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-cyan-900 font-semibold">
                Token hiện tại
              </Text>
              <View
                className={`rounded-full px-3 py-1 ${qrRemaining > 0 ? "bg-cyan-600" : "bg-slate-400"}`}
              >
                <Text className="text-white text-xs font-semibold">
                  {qrRemaining > 0 ? `${qrRemaining}s còn lại` : "Đã hết hạn"}
                </Text>
              </View>
            </View>
            <View className="bg-white rounded-2xl border border-cyan-100 p-4">
              <Text className="text-[11px] uppercase tracking-[2px] text-cyan-700">
                Token
              </Text>
              <Text className="text-slate-900 font-semibold mt-2">
                {generatedQr.token}
              </Text>
              <Text className="text-slate-500 text-sm mt-2">
                Hết hạn: {formatDateTime(generatedQr.expires_at)}
              </Text>
            </View>
          </View>
        ) : (
          <View className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
            <Text className="text-slate-500">Chưa tạo token mới.</Text>
          </View>
        )}
      </View>

      <View className="bg-white rounded-3xl p-5 border border-slate-200">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-lg font-bold text-slate-900">
              Chấm công hôm nay
            </Text>
            <Text className="text-slate-500 mt-1">
              Đối chiếu người đã check-in với lịch office đã duyệt.
            </Text>
          </View>
          <View className="bg-slate-100 rounded-full px-3 py-1">
            <Text className="text-slate-700 text-xs font-semibold">
              {formatDate(new Date().toISOString())}
            </Text>
          </View>
        </View>

        <View className="flex-row flex-wrap mb-4" style={{ gap: 10 }}>
          <View className="flex-1 min-w-[100px] rounded-2xl bg-slate-50 border border-slate-200 p-4">
            <Text className="text-slate-500 text-xs">Đã lên lịch office</Text>
            <Text className="text-slate-900 text-2xl font-bold mt-1">
              {totalTodayExpected}
            </Text>
          </View>
          <View className="flex-1 min-w-[100px] rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
            <Text className="text-emerald-700 text-xs">Đã check-in</Text>
            <Text className="text-emerald-900 text-2xl font-bold mt-1">
              {totalTodayCheckedIn}
            </Text>
          </View>
          <View className="flex-1 min-w-[100px] rounded-2xl bg-rose-50 border border-rose-100 p-4">
            <Text className="text-rose-700 text-xs">Chưa check-in</Text>
            <Text className="text-rose-900 text-2xl font-bold mt-1">
              {totalTodayMissing}
            </Text>
          </View>
        </View>

        <Text className="text-slate-700 font-semibold mb-3">Đã check-in</Text>
        {todayAttendance.length === 0 ? (
          <Text className="text-slate-500">
            Chưa có bản ghi chấm công hôm nay.
          </Text>
        ) : (
          <View style={{ gap: 10 }}>
            {todayAttendance.map((record) => (
              <View
                key={record._id}
                className="rounded-2xl border border-slate-200 p-4 bg-slate-50 flex-row items-center justify-between gap-3"
              >
                <View className="flex-1">
                  <Text className="text-slate-900 font-semibold">
                    {formatEmployee(record.employee, "Nhân viên")}
                  </Text>
                  <Text className="text-slate-600 mt-1">
                    Check-in: {formatDateTime(record.check_in_at)}
                  </Text>
                  <Text className="text-slate-600">
                    Loại lịch:{" "}
                    {entryLabels[record.schedule_type] || record.schedule_type}
                  </Text>
                </View>
                <View className="bg-emerald-100 rounded-full px-3 py-1">
                  <Text className="text-emerald-800 text-xs font-semibold">
                    Đã vào
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <Text className="text-slate-700 font-semibold mt-5 mb-3">
          Chưa check-in
        </Text>
        {missingToday.length === 0 ? (
          <Text className="text-slate-500">
            Không còn người nào chờ check-in trong ngày.
          </Text>
        ) : (
          <View style={{ gap: 10 }}>
            {missingToday.map((item) => (
              <View
                key={`${item.requestId}_${item.employeeId}`}
                className="rounded-2xl border border-rose-100 p-4 bg-rose-50 flex-row items-center justify-between gap-3"
              >
                <View className="flex-1">
                  <Text className="text-rose-950 font-semibold">
                    {formatEmployee(item.employee, "Nhân viên")}
                  </Text>
                  <Text className="text-rose-800 mt-1">
                    Ca: {entryLabels[item.entryType] || item.entryType}
                  </Text>
                </View>
                <View className="bg-rose-100 rounded-full px-3 py-1">
                  <Text className="text-rose-800 text-xs font-semibold">
                    Chưa check-in
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <View className="bg-white rounded-3xl p-5 border border-slate-200">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-lg font-bold text-slate-900">
              Báo cáo tổng hợp
            </Text>
            <Text className="text-slate-500 mt-1">
              Thống kê theo {reportRange === "7d" ? "7 ngày" : "30 ngày"} gần
              nhất.
            </Text>
          </View>
          <View className="flex-row rounded-full bg-slate-100 p-1">
            {(["7d", "30d"] as ReportRange[]).map((range) => (
              <Pressable
                key={range}
                onPress={() => setReportRange(range)}
                className={`px-3 py-2 rounded-full ${reportRange === range ? "bg-slate-900" : "bg-transparent"}`}
              >
                <Text
                  className={
                    reportRange === range
                      ? "text-white font-semibold"
                      : "text-slate-700 font-semibold"
                  }
                >
                  {range === "7d" ? "7 ngày" : "30 ngày"}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="flex-row flex-wrap mb-4" style={{ gap: 10 }}>
          <View className="flex-1 min-w-[100px] rounded-2xl bg-slate-50 border border-slate-200 p-4">
            <Text className="text-slate-500 text-xs">Tổng bản ghi</Text>
            <Text className="text-slate-900 text-2xl font-bold mt-1">
              {reportRows.length}
            </Text>
          </View>
          <View className="flex-1 min-w-[100px] rounded-2xl bg-cyan-50 border border-cyan-100 p-4">
            <Text className="text-cyan-700 text-xs">Nhân sự</Text>
            <Text className="text-cyan-950 text-2xl font-bold mt-1">
              {totalReportEmployees}
            </Text>
          </View>
          <View className="flex-1 min-w-[100px] rounded-2xl bg-violet-50 border border-violet-100 p-4">
            <Text className="text-violet-700 text-xs">Remote</Text>
            <Text className="text-violet-950 text-2xl font-bold mt-1">
              {totalReportRemote}
            </Text>
          </View>
        </View>

        {reportRows.length === 0 ? (
          <Text className="text-slate-500">
            Không có dữ liệu trong khoảng thời gian đã chọn.
          </Text>
        ) : (
          <View style={{ gap: 10 }}>
            {reportRows.map((record) => (
              <View
                key={record._id}
                className="rounded-2xl border border-slate-200 p-4 bg-slate-50"
              >
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="text-slate-900 font-semibold">
                      {formatEmployee(record.employee, "Nhân viên")}
                    </Text>
                    <Text className="text-slate-600 mt-1">
                      Ngày: {formatDate(record.date)}
                    </Text>
                    <Text className="text-slate-600">
                      Check-in: {formatDateTime(record.check_in_at)}
                    </Text>
                    <Text className="text-slate-600">
                      Check-out: {formatDateTime(record.check_out_at)}
                    </Text>
                  </View>
                  <View
                    className={`rounded-full px-3 py-1 ${record.schedule_type === "remote" ? "bg-violet-100" : "bg-blue-100"}`}
                  >
                    <Text
                      className={`text-xs font-semibold ${record.schedule_type === "remote" ? "text-violet-800" : "text-blue-800"}`}
                    >
                      {entryLabels[record.schedule_type] ||
                        record.schedule_type}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <View className="bg-white rounded-3xl p-5 border border-slate-200">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-lg font-bold text-slate-900">
              Heatmap lịch làm việc
            </Text>
            <Text className="text-slate-500 mt-1">
              Dữ liệu phân tích theo tuần đã chọn.
            </Text>
          </View>
          <View className="bg-slate-100 rounded-full px-3 py-1">
            <Text className="text-slate-700 text-xs font-semibold">
              {selectedWeek}
            </Text>
          </View>
        </View>

        {heatmapRows.length === 0 ? (
          <Text className="text-slate-500">
            Chưa có dữ liệu heatmap cho tuần này.
          </Text>
        ) : (
          <View style={{ gap: 12 }}>
            {heatmapRows.map((row) => {
              const total = row.stats.reduce(
                (sum, stat) => sum + stat.count,
                0,
              );
              return (
                <View
                  key={row._id}
                  className="rounded-2xl border border-slate-200 p-4 bg-slate-50"
                >
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-slate-900 font-semibold">
                      {formatDate(row._id)}
                    </Text>
                    <Text className="text-slate-500 text-sm">Tổng {total}</Text>
                  </View>
                  <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                    {row.stats.map((stat) => (
                      <View
                        key={stat.type}
                        className={`rounded-2xl border px-3 py-2 min-w-[110px] ${getEntryColor(stat.type)}`}
                      >
                        <Text className="text-xs uppercase tracking-[2px] opacity-80">
                          {entryLabels[stat.type] || stat.type}
                        </Text>
                        <View className="h-1.5 rounded-full mt-2 bg-slate-900" />
                        <Text className="font-semibold mt-2">
                          {stat.count} lượt
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
