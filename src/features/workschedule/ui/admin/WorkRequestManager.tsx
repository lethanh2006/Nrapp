import { useWorkscheduleAdmin } from "@/src/features/workschedule/hooks/useWorkscheduleAdmin";
import {
  WORK_REQUEST_CONFIG,
  WORK_REQUEST_TYPES,
} from "@/src/features/workschedule/ui/user/workRequestConfig";
import type {
  IWorkRequest,
  WorkRequestStatus,
  WorkRequestType,
} from "@/src/services/workschedule/constant";
import { AppAlert as Alert } from "@/src/shared/ui/AppAlert";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";

const statusMeta: Record<WorkRequestStatus, { label: string; box: string; text: string }> = {
  pending: { label: "Chờ duyệt", box: "bg-amber-50", text: "text-amber-700" },
  approved: { label: "Đã duyệt", box: "bg-emerald-50", text: "text-emerald-700" },
  rejected: { label: "Từ chối", box: "bg-rose-50", text: "text-rose-700" },
  cancelled: { label: "Đã hủy", box: "bg-slate-100", text: "text-slate-600" },
};

const periodLabel = { full_day: "Cả ngày", morning: "Buổi sáng", afternoon: "Buổi chiều" };

export function WorkRequestManager() {
  const {
    getEmployeeRequests,
    approveEmployeeRequest,
    rejectEmployeeRequest,
  } = useWorkscheduleAdmin();
  const [requests, setRequests] = useState<IWorkRequest[]>([]);
  const [status, setStatus] = useState<WorkRequestStatus | "all">("pending");
  const [type, setType] = useState<WorkRequestType | "all">("all");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setRequests(await getEmployeeRequests({ status, type }, true));
    setLoading(false);
  }, [getEmployeeRequests, status, type]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const approve = (request: IWorkRequest) => {
    Alert.alert("Duyệt đơn?", `Xác nhận duyệt ${WORK_REQUEST_CONFIG[request.type].shortTitle.toLowerCase()}.`, [
      { text: "Để sau", style: "cancel" },
      {
        text: "Duyệt đơn",
        onPress: async () => {
          setBusyId(request._id);
          if (await approveEmployeeRequest(request._id)) await loadData();
          setBusyId(null);
        },
      },
    ]);
  };

  const reject = async (request: IWorkRequest) => {
    if (!reason.trim()) {
      Alert.alert("Thiếu lý do", "Vui lòng nhập lý do từ chối để nhân viên có thể xem lại.");
      return;
    }
    setBusyId(request._id);
    if (await rejectEmployeeRequest(request._id, reason.trim())) {
      setRejectingId(null);
      setReason("");
      await loadData();
    }
    setBusyId(null);
  };

  return (
    <View className="rounded-3xl border border-slate-200 bg-white p-4">
      <View className="mb-4 flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-lg font-black text-slate-900">Duyệt đơn từ</Text>
          <Text className="mt-1 text-xs leading-5 text-slate-500">
            Xử lý nghỉ, đi muộn, về sớm, OT, công tác và remote.
          </Text>
        </View>
        <View className="rounded-full bg-amber-50 px-3 py-1.5">
          <Text className="text-xs font-black text-amber-700">{requests.length} đơn</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
        {(["pending", "all", "approved", "rejected", "cancelled"] as const).map(item => (
          <Pressable
            className={`mr-2 rounded-full border px-3 py-2 ${
              status === item ? "border-slate-900 bg-slate-900" : "border-slate-200 bg-white"
            }`}
            key={item}
            onPress={() => setStatus(item)}
          >
            <Text className={`text-[11px] font-black ${status === item ? "text-white" : "text-slate-600"}`}>
              {item === "all" ? "Tất cả" : statusMeta[item].label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
        <Pressable
          className={`mr-2 rounded-xl px-3 py-2 ${type === "all" ? "bg-cyan-100" : "bg-slate-100"}`}
          onPress={() => setType("all")}
        >
          <Text className={`text-[11px] font-bold ${type === "all" ? "text-cyan-800" : "text-slate-500"}`}>
            Mọi loại
          </Text>
        </Pressable>
        {WORK_REQUEST_TYPES.map(item => (
          <Pressable
            className={`mr-2 rounded-xl px-3 py-2 ${type === item ? "bg-cyan-100" : "bg-slate-100"}`}
            key={item}
            onPress={() => setType(item)}
          >
            <Text className={`text-[11px] font-bold ${type === item ? "text-cyan-800" : "text-slate-500"}`}>
              {WORK_REQUEST_CONFIG[item].shortTitle}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {loading ? (
        <View className="items-center py-16">
          <ActivityIndicator color="#0891b2" />
        </View>
      ) : requests.length === 0 ? (
        <View className="items-center rounded-2xl bg-slate-50 p-8">
          <Ionicons name="checkmark-done-circle-outline" size={28} color="#94a3b8" />
          <Text className="mt-3 text-sm font-black text-slate-700">Không có đơn phù hợp</Text>
        </View>
      ) : (
        <View className="gap-3">
          {requests.map(request => {
            const config = WORK_REQUEST_CONFIG[request.type];
            const requestStatus = statusMeta[request.status];
            const employeeName = request.employee?.name || request.employee?.username || request.employee?.email || "Nhân viên";
            return (
              <View className="rounded-2xl border border-slate-200 p-4" key={request._id}>
                <View className="flex-row items-start">
                  <View className={`h-10 w-10 items-center justify-center rounded-xl ${config.background}`}>
                    <Ionicons name={config.icon} size={19} color={config.color} />
                  </View>
                  <View className="ml-3 flex-1">
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 pr-2">
                        <Text className="text-sm font-black text-slate-800">{config.shortTitle}</Text>
                        <Text className="mt-0.5 text-[11px] font-semibold text-cyan-700">{employeeName}</Text>
                      </View>
                      <View className={`rounded-full px-2.5 py-1 ${requestStatus.box}`}>
                        <Text className={`text-[10px] font-black ${requestStatus.text}`}>{requestStatus.label}</Text>
                      </View>
                    </View>
                    <Text className="mt-2 text-xs text-slate-500">
                      {new Date(request.start_at).toLocaleString("vi-VN")} · {periodLabel[request.period]}
                    </Text>
                    {request.end_at ? (
                      <Text className="mt-1 text-xs text-slate-500">
                        Đến {new Date(request.end_at).toLocaleString("vi-VN")}
                      </Text>
                    ) : null}
                    <Text className="mt-2 text-xs leading-5 text-slate-600">{request.reason}</Text>
                    {request.location ? <Text className="mt-1 text-xs text-slate-500">Địa điểm: {request.location}</Text> : null}
                    {request.project ? <Text className="mt-1 text-xs text-slate-500">Dự án: {request.project}</Text> : null}
                    {request.estimated_cost !== undefined ? (
                      <Text className="mt-1 text-xs text-slate-500">
                        Chi phí: {request.estimated_cost.toLocaleString("vi-VN")} VNĐ
                      </Text>
                    ) : null}
                  </View>
                </View>

                {request.status === "pending" ? (
                  rejectingId === request._id ? (
                    <View className="mt-3 rounded-2xl bg-rose-50 p-3">
                      <TextInput
                        className="min-h-20 rounded-xl border border-rose-100 bg-white p-3 text-xs text-slate-700"
                        multiline
                        onChangeText={setReason}
                        placeholder="Lý do từ chối..."
                        placeholderTextColor="#94a3b8"
                        textAlignVertical="top"
                        value={reason}
                      />
                      <View className="mt-2 flex-row gap-2">
                        <Pressable
                          className="flex-1 items-center rounded-xl bg-white py-2.5"
                          onPress={() => {
                            setRejectingId(null);
                            setReason("");
                          }}
                        >
                          <Text className="text-xs font-black text-slate-600">Hủy</Text>
                        </Pressable>
                        <Pressable
                          className="flex-1 items-center rounded-xl bg-rose-600 py-2.5"
                          disabled={busyId === request._id}
                          onPress={() => void reject(request)}
                        >
                          <Text className="text-xs font-black text-white">Xác nhận từ chối</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <View className="mt-3 flex-row gap-2">
                      <Pressable
                        className="flex-1 items-center rounded-xl border border-rose-100 py-2.5"
                        onPress={() => setRejectingId(request._id)}
                      >
                        <Text className="text-xs font-black text-rose-600">Từ chối</Text>
                      </Pressable>
                      <Pressable
                        className="flex-1 items-center rounded-xl bg-emerald-600 py-2.5"
                        disabled={busyId === request._id}
                        onPress={() => approve(request)}
                      >
                        <Text className="text-xs font-black text-white">
                          {busyId === request._id ? "Đang xử lý..." : "Duyệt đơn"}
                        </Text>
                      </Pressable>
                    </View>
                  )
                ) : null}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
