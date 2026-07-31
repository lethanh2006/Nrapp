import ScheduleForm from "@/src/features/workschedule/ui/common/ScheduleForm";
import { RegistrationPolicyCard } from "@/src/features/workschedule/ui/user/RegistrationPolicyCard";
import type {
  IScheduleEntry,
  IScheduleRequest,
  IWorkPolicy,
} from "@/src/services/workschedule/constant";
import {
  getAllowedWeekRange,
  isRegistrationClosed,
} from "@/src/features/workschedule/utils/date";
import { useWorkscheduleUser } from "@/src/features/workschedule/hooks/useWorkscheduleUser";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";

export default function UserWorkscheduleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getRequestInfo, updateEntries, submitRequest, deleteRequest, getPolicy, loading } =
    useWorkscheduleUser();

  const [schedule, setSchedule] = useState<IScheduleRequest | null>(null);
  const [policy, setPolicy] = useState<IWorkPolicy | null>(null);
  const [entries, setEntries] = useState<IScheduleEntry[]>([]);

  const allowedWeeksRange = React.useMemo(() => getAllowedWeekRange(), []);

  const isOutsideRegistrationWindow = React.useMemo(
    () => isRegistrationClosed(policy),
    [policy],
  );

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
          <RegistrationPolicyCard
            policy={policy}
            closed={isOutsideRegistrationWindow}
            allowedWeeks={allowedWeeksRange}
            className="mb-6"
          />
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
