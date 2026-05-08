import React from "react";
import { View, Text, Pressable, ScrollView, TextInput } from "react-native";
import { useAdminData } from "@/context/AdminContext";
import { Ionicons } from "@expo/vector-icons";

type RequestStatus = "all" | "draft" | "pending" | "approved" | "rejected";

const requestStatusLabels: Record<RequestStatus, string> = {
  all: "Tất cả",
  draft: "Nháp",
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
};

const statusStyle: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-800",
};

const formatEmployee = (employee?: any, fallback = "Không rõ") => {
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

export function RequestManager() {
  const {
    pendingSchedules,
    allSchedules,
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
    setSelectedWeekOffset,
  } = useAdminData();

  return (
    <View style={{ gap: 16 }}>
      {/* Duyệt lịch chờ xử lý */}
      <View className="bg-white rounded-3xl p-5 border border-slate-200">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-lg font-bold text-slate-900">
              Duyệt lịch chờ xử lý
            </Text>
            <Text className="text-slate-500 mt-1">
              Chọn nhiều request rồi duyệt hàng loạt.
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

                  {isRejecting && (
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
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Toàn bộ request */}
      <View className="bg-white rounded-3xl p-5 border border-slate-200">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-lg font-bold text-slate-900">
              Toàn bộ request
            </Text>
            <Text className="text-slate-500 mt-1">
              Lọc theo trạng thái tuần đang chọn.
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
            {(Object.keys(requestStatusLabels) as RequestStatus[]).map((status) => (
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
            ))}
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
                    {request.reject_reason && (
                      <Text className="text-rose-700 mt-1">
                        Lý do từ chối: {request.reject_reason}
                      </Text>
                    )}
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
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
