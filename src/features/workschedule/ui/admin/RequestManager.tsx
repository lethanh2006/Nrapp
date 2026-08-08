import { useAdminData } from "@/src/features/workschedule/model/AdminWorkscheduleContext";
import { useWorkscheduleAdmin } from "@/src/features/workschedule/hooks/useWorkscheduleAdmin";
import type { AdminScheduleRequest } from "@/src/features/workschedule/hooks/useWorkscheduleAdmin";
import ScheduleForm from "@/src/features/workschedule/ui/common/ScheduleForm";
import type { EntryType, IScheduleEntry, WorkPeriod } from "@/src/services/workschedule/constant";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";

type RequestStatus = "all" | "pending" | "approved" | "rejected";

const requestStatusMeta: Record<
  RequestStatus,
  { label: string; box: string; text: string }
> = {
  all: { label: "Tất cả", box: "bg-slate-100", text: "text-slate-700" },
  pending: { label: "Chờ duyệt", box: "bg-amber-50", text: "text-amber-700" },
  approved: { label: "Đã duyệt", box: "bg-emerald-50", text: "text-emerald-700" },
  rejected: { label: "Từ chối", box: "bg-red-50", text: "text-red-700" },
};

const formatEmployee = (employee?: AdminScheduleRequest["employee"]) =>
  employee?.name || employee?.username || employee?.email || "Nhân viên";

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("vi-VN");
};

const formatDateTime = (value?: string) => {
  if (!value) return "Chưa có";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Chưa có" : date.toLocaleString("vi-VN");
};

export function RequestManager() {
  const {
    allSchedules,
    pendingSchedules,
    requestFilter,
    setRequestFilter,
    selectedPendingIds,
    togglePendingSelection,
    handleApprove,
    handleBulkApprove,
    handleReject,
    rejectingRequestId,
    setRejectingRequestId,
    rejectReason,
    setRejectReason,
    busyRequestId,
    bulkBusy,
    selectedWeekLabel,
    selectedWeekOffset,
    setSelectedWeekOffset,
    handleAdminUpdateEntries,
  } = useAdminData();
  const { getScheduleDetail } = useWorkscheduleAdmin();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null);
  const [editEntries, setEditEntries] = useState<IScheduleEntry[]>([]);
  const [savedEntries, setSavedEntries] = useState<IScheduleEntry[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  const visiblePendingIds = useMemo(
    () => allSchedules.filter((request) => request.status === "pending").map((request) => request._id),
    [allSchedules],
  );
  const allVisibleSelected =
    visiblePendingIds.length > 0 && visiblePendingIds.every((id) => selectedPendingIds.includes(id));

  const toggleSelectAll = () => {
    visiblePendingIds.forEach((id) => {
      const isSelected = selectedPendingIds.includes(id);
      if ((allVisibleSelected && isSelected) || (!allVisibleSelected && !isSelected)) {
        togglePendingSelection(id);
      }
    });
  };

  const handleToggleExpand = async (request: AdminScheduleRequest) => {
    if (expandedId === request._id) {
      setExpandedId(null);
      setIsEditing(false);
      setRejectingRequestId(null);
      return;
    }

    setExpandedId(request._id);
    setLoadingDetailId(request._id);
    setIsEditing(false);
    setRejectingRequestId(null);
    const detail = await getScheduleDetail(request._id);
    setLoadingDetailId(null);

    if (!detail) {
      setExpandedId(null);
      return;
    }
    const entries = detail.entries || [];
    setEditEntries(entries);
    setSavedEntries(entries);
  };

  const handleChangeEntry = (
    date: string,
    field: "type" | "period" | "note",
    value: string,
  ) => {
    setEditEntries((previous) =>
      previous.map((entry) => {
        if (!entry.date.startsWith(date)) return entry;
        if (field === "type") return { ...entry, type: value as EntryType };
        if (field === "period") return { ...entry, period: value as WorkPeriod };
        return { ...entry, note: value };
      }),
    );
  };

  const handleSave = async (id: string) => {
    const success = await handleAdminUpdateEntries(id, editEntries);
    if (success) {
      setSavedEntries(editEntries);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditEntries(savedEntries);
    setIsEditing(false);
  };

  return (
    <View className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <View className="border-b border-slate-100 p-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-lg font-black text-slate-900">Yêu cầu lịch làm</Text>
            <Text className="mt-1 text-xs leading-5 text-slate-500">
              Duyệt, từ chối hoặc điều chỉnh lịch trong cùng một danh sách.
            </Text>
          </View>
          <View className="rounded-full bg-red-50 px-3 py-1.5">
            <Text className="text-xs font-black text-red-700">
              {pendingSchedules.length} chờ duyệt
            </Text>
          </View>
        </View>

        <View className="mt-4 flex-row items-center rounded-2xl bg-slate-50 p-1">
          <Pressable
            accessibilityLabel="Xem tuần trước"
            className="h-10 w-10 items-center justify-center rounded-xl bg-white"
            onPress={() => setSelectedWeekOffset((previous) => previous - 1)}
          >
            <Ionicons name="chevron-back" size={18} color="#475569" />
          </Pressable>
          <Pressable className="flex-1 items-center" onPress={() => setSelectedWeekOffset(0)}>
            <Text className="text-[10px] font-black uppercase tracking-wider text-red-600">
              {selectedWeekOffset === 0 ? "Tuần hiện tại" : selectedWeekOffset < 0 ? "Tuần trước" : "Tuần sau"}
            </Text>
            <Text className="mt-0.5 text-sm font-black text-slate-900">Từ {selectedWeekLabel}</Text>
          </Pressable>
          <Pressable
            accessibilityLabel="Xem tuần sau"
            className="h-10 w-10 items-center justify-center rounded-xl bg-white"
            onPress={() => setSelectedWeekOffset((previous) => previous + 1)}
          >
            <Ionicons name="chevron-forward" size={18} color="#475569" />
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
          {(["pending", "all", "approved", "rejected"] as RequestStatus[]).map((status) => {
            const active = requestFilter === status;
            return (
              <Pressable
                className={`mr-2 rounded-full border px-4 py-2 ${
                  active ? "border-red-600 bg-red-600" : "border-slate-200 bg-white"
                }`}
                key={status}
                onPress={() => setRequestFilter(status)}
              >
                <Text className={`text-xs font-black ${active ? "text-white" : "text-slate-600"}`}>
                  {requestStatusMeta[status].label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {requestFilter === "pending" && allSchedules.length > 0 ? (
        <View className="flex-row items-center border-b border-slate-100 bg-red-50/60 px-4 py-3">
          <Pressable className="flex-row items-center" onPress={toggleSelectAll}>
            <View
              className={`h-5 w-5 items-center justify-center rounded-md border ${
                allVisibleSelected ? "border-red-600 bg-red-600" : "border-slate-300 bg-white"
              }`}
            >
              {allVisibleSelected ? <Ionicons name="checkmark" size={13} color="#fff" /> : null}
            </View>
            <Text className="ml-2 text-xs font-bold text-slate-700">Chọn tất cả tuần này</Text>
          </Pressable>
          <Pressable
            className={`ml-auto rounded-xl px-3 py-2 ${
              bulkBusy || selectedPendingIds.length === 0 ? "bg-red-200" : "bg-red-600"
            }`}
            disabled={bulkBusy || selectedPendingIds.length === 0}
            onPress={() => void handleBulkApprove()}
          >
            <Text className="text-xs font-black text-white">
              {bulkBusy ? "Đang duyệt..." : `Duyệt ${selectedPendingIds.length} lịch`}
            </Text>
          </Pressable>
        </View>
      ) : null}

      <View className="p-4">
        {allSchedules.length === 0 ? (
          <View className="items-center rounded-2xl bg-slate-50 px-5 py-10">
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white">
              <Ionicons name="calendar-clear-outline" size={23} color="#94a3b8" />
            </View>
            <Text className="mt-3 text-sm font-black text-slate-700">Không có lịch phù hợp</Text>
            <Text className="mt-1 text-center text-xs leading-5 text-slate-500">
              Hãy đổi tuần hoặc trạng thái để xem các yêu cầu khác.
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {allSchedules.map((request) => {
              const expanded = expandedId === request._id;
              const selected = selectedPendingIds.includes(request._id);
              const rejecting = rejectingRequestId === request._id;
              const status = requestStatusMeta[request.status] || requestStatusMeta.pending;
              return (
                <View
                  className={`overflow-hidden rounded-2xl border ${
                    expanded ? "border-red-200 bg-white" : "border-slate-200 bg-slate-50/70"
                  }`}
                  key={request._id}
                >
                  <View className="flex-row items-start p-4">
                    {request.status === "pending" ? (
                      <Pressable
                        accessibilityLabel="Chọn lịch để duyệt hàng loạt"
                        className={`mr-3 mt-0.5 h-6 w-6 items-center justify-center rounded-lg border ${
                          selected ? "border-red-600 bg-red-600" : "border-slate-300 bg-white"
                        }`}
                        onPress={() => togglePendingSelection(request._id)}
                      >
                        {selected ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
                      </Pressable>
                    ) : null}
                    <Pressable className="flex-1" onPress={() => void handleToggleExpand(request)}>
                      <View className="flex-row items-start">
                        <View className="flex-1 pr-2">
                          <Text className="text-sm font-black text-slate-900">
                            {formatEmployee(request.employee)}
                          </Text>
                          <Text className="mt-1 text-xs text-slate-500">
                            Tuần từ {formatDate(request.week_start)}
                          </Text>
                        </View>
                        <View className={`rounded-full px-2.5 py-1 ${status.box}`}>
                          <Text className={`text-[10px] font-black ${status.text}`}>{status.label}</Text>
                        </View>
                        <Ionicons
                          name={expanded ? "chevron-up" : "chevron-down"}
                          size={17}
                          color="#94a3b8"
                          style={{ marginLeft: 8, marginTop: 2 }}
                        />
                      </View>
                      <Text className="mt-2 text-[11px] text-slate-400">
                        Gửi lúc {formatDateTime(request.submitted_at)}
                      </Text>
                    </Pressable>
                  </View>

                  {expanded ? (
                    <View className="border-t border-slate-100 px-4 pb-4 pt-3">
                      {loadingDetailId === request._id ? (
                        <View className="items-center py-8">
                          <ActivityIndicator color="#dc2626" />
                          <Text className="mt-2 text-xs text-slate-500">Đang tải chi tiết...</Text>
                        </View>
                      ) : (
                        <>
                          <View className="mb-3 flex-row items-center justify-between">
                            <Text className="text-xs font-black uppercase tracking-wider text-slate-500">
                              Chi tiết từng ngày
                            </Text>
                            <Pressable
                              className={`rounded-xl px-3 py-2 ${isEditing ? "bg-red-600" : "bg-slate-100"}`}
                              disabled={busyRequestId === request._id}
                              onPress={() => (isEditing ? void handleSave(request._id) : setIsEditing(true))}
                            >
                              <Text className={`text-xs font-black ${isEditing ? "text-white" : "text-slate-700"}`}>
                                {isEditing ? "Lưu thay đổi" : "Điều chỉnh"}
                              </Text>
                            </Pressable>
                          </View>
                          <ScheduleForm
                            entries={editEntries}
                            onChangeEntry={handleChangeEntry}
                            readOnly={!isEditing}
                            startDate={new Date(request.week_start)}
                          />
                          {isEditing ? (
                            <Pressable className="mt-3 items-center py-2" onPress={handleCancelEdit}>
                              <Text className="text-xs font-bold text-slate-500">Bỏ thay đổi</Text>
                            </Pressable>
                          ) : null}

                          {request.reject_reason ? (
                            <View className="mt-3 rounded-xl bg-red-50 p-3">
                              <Text className="text-xs font-bold text-red-700">
                                Lý do từ chối: {request.reject_reason}
                              </Text>
                            </View>
                          ) : null}

                          {request.status === "pending" ? (
                            rejecting ? (
                              <View className="mt-4 rounded-2xl bg-red-50 p-3">
                                <TextInput
                                  className="min-h-20 rounded-xl border border-red-100 bg-white p-3 text-xs text-slate-800"
                                  multiline
                                  onChangeText={setRejectReason}
                                  placeholder="Nhập lý do để nhân viên biết cần điều chỉnh gì..."
                                  placeholderTextColor="#94a3b8"
                                  textAlignVertical="top"
                                  value={rejectReason}
                                />
                                <View className="mt-2 flex-row gap-2">
                                  <Pressable
                                    className="flex-1 items-center rounded-xl bg-white py-2.5"
                                    onPress={() => {
                                      setRejectingRequestId(null);
                                      setRejectReason("");
                                    }}
                                  >
                                    <Text className="text-xs font-black text-slate-600">Hủy</Text>
                                  </Pressable>
                                  <Pressable
                                    className="flex-1 items-center rounded-xl bg-red-600 py-2.5"
                                    disabled={busyRequestId === request._id}
                                    onPress={() => void handleReject(request._id)}
                                  >
                                    <Text className="text-xs font-black text-white">Xác nhận từ chối</Text>
                                  </Pressable>
                                </View>
                              </View>
                            ) : (
                              <View className="mt-4 flex-row gap-2">
                                <Pressable
                                  className="flex-1 items-center rounded-xl border border-red-200 py-3"
                                  onPress={() => {
                                    setRejectReason("");
                                    setRejectingRequestId(request._id);
                                  }}
                                >
                                  <Text className="text-xs font-black text-red-600">Từ chối</Text>
                                </Pressable>
                                <Pressable
                                  className="flex-1 items-center rounded-xl bg-emerald-600 py-3"
                                  disabled={busyRequestId === request._id}
                                  onPress={() => void handleApprove(request._id)}
                                >
                                  <Text className="text-xs font-black text-white">
                                    {busyRequestId === request._id ? "Đang xử lý..." : "Duyệt lịch"}
                                  </Text>
                                </Pressable>
                              </View>
                            )
                          ) : null}
                        </>
                      )}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}
