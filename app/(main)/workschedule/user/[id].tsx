import ScheduleForm from "@/components/workschedule/user/ScheduleForm";
import { IScheduleEntry, IScheduleRequest, IWorkPolicy } from "@/components/workschedule/types";
import { Ionicons } from "@expo/vector-icons";

const getDayName = (dayNum: number) => {
  const days = ["", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"];
  return days[dayNum] || `Thứ ${dayNum}`;
};
import { useWorkscheduleUser } from "@/hooks/useWorkscheduleUser";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";

export default function ScheduleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getRequestInfo, updateEntries, submitRequest, deleteRequest, getPolicy, loading } =
    useWorkscheduleUser();

  const [schedule, setSchedule] = useState<IScheduleRequest | null>(null);
  const [policy, setPolicy] = useState<IWorkPolicy | null>(null);
  const [entries, setEntries] = useState<IScheduleEntry[]>([]);

  const formatDisplayDate = (dateVal: string | Date | undefined) => {
    if (!dateVal) return "";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${min} ngày ${dd}/${mm}/${yyyy}`;
  };

  const isOutsideRegistrationWindow = React.useMemo(() => {
    if (!policy) return false;
    if (policy.locked) return true;
    const now = new Date();
    const start = new Date(policy.registration_start);
    const end = new Date(policy.registration_end);
    return now < start || now > end;
  }, [policy]);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    const [data, policyData] = await Promise.all([
      getRequestInfo(id),
      getPolicy()
    ]);
    if (data) {
      setSchedule(data);
      setEntries(data.entries || []);
    }
    setPolicy(policyData);
  };

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
          <View className={`mb-6 p-4 rounded-3xl border flex-row items-center gap-3 shadow-xs ${
            isOutsideRegistrationWindow 
              ? "bg-rose-50 border-rose-100" 
              : "bg-blue-50/60 border-blue-100/50"
          }`}>
            <View className={isOutsideRegistrationWindow ? "bg-rose-100 p-2 rounded-2xl" : "bg-blue-100 p-2 rounded-2xl"}>
              <Ionicons 
                name={isOutsideRegistrationWindow ? "lock-closed" : "information-circle"} 
                size={18} 
                color={isOutsideRegistrationWindow ? "#e11d48" : "#2563eb"} 
              />
            </View>
            <View className="flex-1">
              <Text className={`text-xs font-black mb-0.5 ${isOutsideRegistrationWindow ? "text-rose-900" : "text-blue-900"}`}>
                {isOutsideRegistrationWindow ? "Đã khóa đăng ký lịch làm việc" : "Thời gian đăng ký lịch làm việc"}
              </Text>
              <Text className={`text-[11px] font-bold leading-normal ${isOutsideRegistrationWindow ? "text-rose-700" : "text-blue-700"}`}>
                {policy.locked
                  ? "Hệ thống hiện đang khóa đăng ký lịch làm việc. Bạn chỉ có thể xem lịch biểu hiện tại."
                  : isOutsideRegistrationWindow 
                    ? `Hệ thống hiện đang đóng đăng ký lịch. Thời hạn đăng ký từ ${formatDisplayDate(policy.registration_start)} đến ${formatDisplayDate(policy.registration_end)}.`
                    : `Hệ thống đang mở đăng ký lịch từ ${formatDisplayDate(policy.registration_start)} đến ${formatDisplayDate(policy.registration_end)}.`
                }
              </Text>
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
