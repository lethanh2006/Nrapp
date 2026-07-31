import ScheduleForm from "@/src/features/workschedule/ui/common/ScheduleForm";
import { IScheduleEntry, IScheduleRequest, IWorkPolicy } from "@/src/features/workschedule/model/workschedule.types";
import { Ionicons } from "@expo/vector-icons";
import { useWorkscheduleUser } from "@/src/features/workschedule/api/useUserWorkscheduleApi";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";

const getWeekStartMonday = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - (day === 0 ? 6 : day - 1);
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

export default function ScheduleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getRequestInfo, updateEntries, submitRequest, deleteRequest, getPolicy, loading } =
    useWorkscheduleUser();

  const [schedule, setSchedule] = useState<IScheduleRequest | null>(null);
  const [policy, setPolicy] = useState<IWorkPolicy | null>(null);
  const [entries, setEntries] = useState<IScheduleEntry[]>([]);

  const formatDateVi = (dateVal: string | Date | undefined) => {
    if (!dateVal) return "";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const formatDateTimeVi = (dateVal: string | Date | undefined) => {
    if (!dateVal) return "";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${min} - ${dd}/${mm}/${yyyy}`;
  };

  const allowedWeeksRange = React.useMemo(() => {
    const now = new Date();
    const currentWeekMon = getWeekStartMonday(now);
    const maxAllowedWeekMon = new Date(currentWeekMon);
    maxAllowedWeekMon.setDate(maxAllowedWeekMon.getDate() + 28);
    return {
      start: currentWeekMon,
      end: maxAllowedWeekMon,
    };
  }, []);

  const isOutsideRegistrationWindow = React.useMemo(() => {
    if (!policy) return false;
    if (policy.locked) return true;
    const now = new Date();
    const start = new Date(policy.registration_start);
    const end = new Date(policy.registration_end);
    return now < start || now > end;
  }, [policy]);

  const loadData = useCallback(async () => {
    const [data, policyData] = await Promise.all([
      getRequestInfo(id),
      getPolicy()
    ]);
    if (data) {
      setSchedule(data);
      setEntries(data.entries || []);
    }
    setPolicy(policyData);
  }, [getPolicy, getRequestInfo, id]);

  useEffect(() => {
    if (id) void loadData();
  }, [id, loadData]);

  const handleChangeEntry = (date: string, field: "type" | "note", value: string) => {
    setEntries((prev) => {
      return prev.map((e) => (e.date.startsWith(date) ? { ...e, [field]: value } : e));
    });
  };

  const handleUpdate = async () => {
    if (isOutsideRegistrationWindow) {
      Alert.alert("Lỗi", "Ngoài khoảng thời gian đăng ký lịch làm việc");
      return;
    }
    const success = await updateEntries(id, entries);
    if (success) {
      loadData();
    }
  };

  const handleSubmit = async () => {
    if (isOutsideRegistrationWindow) {
      Alert.alert("Lỗi", "Ngoài khoảng thời gian đăng ký lịch làm việc");
      return;
    }
    Alert.alert(
      "Xác nhận nộp",
      "Sau khi nộp, bạn sẽ không thể chỉnh sửa lịch này. Bạn có chắc chắn?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Nộp",
          style: "default",
          onPress: async () => {
            const success = await submitRequest(id);
            if (success) {
              router.back();
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    if (isOutsideRegistrationWindow) {
      Alert.alert("Lỗi", "Ngoài khoảng thời gian đăng ký lịch làm việc");
      return;
    }
    Alert.alert("Xác nhận xoá", "Bạn có chắc chắn muốn xoá bản nháp này không?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xoá",
        style: "destructive",
        onPress: async () => {
          const success = await deleteRequest(id);
          if (success) {
            router.back();
          }
        },
      },
    ]);
  };

  if (!schedule) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const isDraft = schedule.status === "draft";
  const startDate = new Date(schedule.week_start);

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
          <Text className="text-gray-500 mb-1">Tuần làm việc</Text>
          <Text className="text-xl font-bold text-blue-900 mb-2">
            {startDate.toLocaleDateString("vi-VN")}
          </Text>
          <Text className="text-sm font-medium text-gray-700">
            Trạng thái: <Text className="uppercase">{schedule.status}</Text>
          </Text>
        </View>

        {policy && (
          <View className="mb-6 p-4 rounded-3xl border border-slate-200/80 bg-white shadow-xs">
            <View className="flex-row items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <View className="flex-row items-center space-x-2">
                <View className="bg-blue-50 p-1.5 rounded-xl">
                  <Ionicons name="information-circle-outline" size={16} color="#2563eb" />
                </View>
                <Text className="text-xs font-black text-slate-800 ml-1.5">Thông tin đăng ký lịch</Text>
              </View>
              <View className={`px-2.5 py-0.5 rounded-full border ${isOutsideRegistrationWindow ? "bg-rose-50 border-rose-100" : "bg-emerald-50 border-emerald-100"}`}>
                <Text className={`text-[10px] font-black uppercase ${isOutsideRegistrationWindow ? "text-rose-600" : "text-emerald-600"}`}>
                  {isOutsideRegistrationWindow ? "Đang Khóa" : "Đang Mở"}
                </Text>
              </View>
            </View>

            <View style={{ gap: 12 }}>
              <View className="flex-row items-start space-x-3">
                <View className="bg-slate-50 p-2 rounded-2xl border border-slate-100 mt-0.5">
                  <Ionicons name="time-outline" size={16} color="#64748b" />
                </View>
                <View className="flex-1 ml-2">
                  <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Thời gian mở cổng đăng ký</Text>
                  <Text className="text-xs font-bold text-slate-700 mt-0.5">
                    Từ {formatDateTimeVi(policy.registration_start)} đến {formatDateTimeVi(policy.registration_end)}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start space-x-3">
                <View className="bg-slate-50 p-2 rounded-2xl border border-slate-100 mt-0.5">
                  <Ionicons name="calendar-outline" size={16} color="#64748b" />
                </View>
                <View className="flex-1 ml-2">
                  <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Phạm vi các tuần được đăng ký</Text>
                  <Text className="text-xs font-bold text-slate-700 mt-0.5">
                    Tuần từ <Text className="text-blue-600 font-extrabold">{formatDateVi(allowedWeeksRange.start)}</Text> đến tuần <Text className="text-blue-600 font-extrabold">{formatDateVi(allowedWeeksRange.end)}</Text>
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <ScheduleForm
          startDate={startDate}
          entries={entries}
          onChangeEntry={handleChangeEntry}
          readOnly={!isDraft || isOutsideRegistrationWindow}
        />

        {isDraft && !isOutsideRegistrationWindow && (
          <View className="mt-8 gap-3">
            <Pressable
              onPress={handleUpdate}
              disabled={loading}
              className="bg-blue-100 p-4 rounded-xl items-center"
            >
              <Text className="text-blue-700 font-bold text-lg">Lưu Thay Đổi (Nháp)</Text>
            </Pressable>

            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              className="bg-green-600 p-4 rounded-xl items-center"
            >
              <Text className="text-white font-bold text-lg">Nộp Chờ Duyệt</Text>
            </Pressable>

            <Pressable
              onPress={handleDelete}
              disabled={loading}
              className="mt-4 p-4 rounded-xl items-center border border-red-200"
            >
              <Text className="text-red-500 font-bold">Xoá Lịch Này</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
