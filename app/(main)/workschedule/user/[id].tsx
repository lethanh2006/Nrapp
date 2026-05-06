import ScheduleForm from "@/components/workschedule/user/ScheduleForm";
import { IScheduleEntry, IScheduleRequest } from "@/components/workschedule/types";
import { useWorkscheduleUser } from "@/hooks/useWorkscheduleUser";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";

export default function ScheduleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getRequestInfo, updateEntries, submitRequest, deleteRequest, loading } =
    useWorkscheduleUser();

  const [schedule, setSchedule] = useState<IScheduleRequest | null>(null);
  const [entries, setEntries] = useState<IScheduleEntry[]>([]);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    const data = await getRequestInfo(id);
    if (data) {
      setSchedule(data);
      setEntries(data.entries || []);
    }
  };

  const handleChangeEntry = (date: string, field: "type" | "note", value: string) => {
    setEntries((prev) => {
      return prev.map((e) => (e.date.startsWith(date) ? { ...e, [field]: value } : e));
    });
  };

  const handleUpdate = async () => {
    const success = await updateEntries(id, entries);
    if (success) {
      loadData();
    }
  };

  const handleSubmit = async () => {
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

        <ScheduleForm
          startDate={startDate}
          entries={entries}
          onChangeEntry={handleChangeEntry}
          readOnly={!isDraft}
        />

        {isDraft && (
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
