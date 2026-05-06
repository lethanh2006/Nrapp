import ScheduleForm from "@/components/workschedule/user/ScheduleForm";
import { IScheduleEntry } from "@/components/workschedule/types";
import { useWorkscheduleUser } from "@/hooks/useWorkscheduleUser";
import { router } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";

// Hàm lấy ngày Thứ 2 của tuần hiện tại hoặc các tuần tiếp theo
const getNextMonday = (offsetWeeks = 0) => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Điều chỉnh về thứ 2
  d.setDate(diff + offsetWeeks * 7);
  d.setHours(0, 0, 0, 0);
  return d;
};

export default function CreateScheduleScreen() {
  const { createRequest, loading } = useWorkscheduleUser();

  const [weekOffset, setWeekOffset] = useState(1); // Mặc định tạo cho tuần sau
  const startDate = getNextMonday(weekOffset);

  const [entries, setEntries] = useState<IScheduleEntry[]>([]);

  const handleChangeEntry = (date: string, field: "type" | "note", value: string) => {
    setEntries((prev) => {
      const existing = prev.find((e) => e.date.startsWith(date));
      if (existing) {
        return prev.map((e) => (e.date.startsWith(date) ? { ...e, [field]: value } : e));
      }
      // Nếu chưa có, tạo mặc định là type office, rồi update field đó
      return [
        ...prev,
        { date, type: field === "type" ? (value as any) : "office", note: field === "note" ? value : "" },
      ];
    });
  };

  const handleSave = async () => {
    // Fill các ngày còn thiếu với type='office' mặc định
    const fullEntries: IScheduleEntry[] = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      const existing = entries.find((e) => e.date.startsWith(dateStr));
      return existing || { date: dateStr, type: "office", note: "" };
    });

    const res = await createRequest(startDate.toISOString(), fullEntries);
    if (res) {
      router.back();
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex-row items-center justify-between">
          <Pressable
            onPress={() => setWeekOffset(weekOffset - 1)}
            className="p-2 bg-gray-100 rounded-lg"
          >
            <Text className="text-gray-600 font-bold">{"<"}</Text>
          </Pressable>
          <View className="items-center">
            <Text className="text-sm text-gray-500">Chọn tuần</Text>
            <Text className="text-base font-bold text-blue-600">
              {startDate.toLocaleDateString("vi-VN")}
            </Text>
          </View>
          <Pressable
            onPress={() => setWeekOffset(weekOffset + 1)}
            className="p-2 bg-gray-100 rounded-lg"
          >
            <Text className="text-gray-600 font-bold">{">"}</Text>
          </Pressable>
        </View>

        <ScheduleForm startDate={startDate} entries={entries} onChangeEntry={handleChangeEntry} />

        <Pressable
          onPress={handleSave}
          disabled={loading}
          className={`mt-6 p-4 rounded-xl items-center flex-row justify-center ${
            loading ? "bg-gray-400" : "bg-blue-600"
          }`}
        >
          {loading && <ActivityIndicator color="white" className="mr-2" />}
          <Text className="text-white font-bold text-lg">Tạo Lịch Nháp</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
