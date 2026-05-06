import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { IScheduleRequest } from "../types";

interface Props {
  schedules: IScheduleRequest[];
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-200 text-gray-800",
  pending: "bg-yellow-200 text-yellow-800",
  approved: "bg-green-200 text-green-800",
  rejected: "bg-red-200 text-red-800",
};

const statusText: Record<string, string> = {
  draft: "Bản nháp",
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
};

export default function ScheduleList({ schedules }: Props) {
  if (!schedules || schedules.length === 0) {
    return (
      <View className="py-10 items-center justify-center">
        <Text className="text-gray-500 text-lg">
          Bạn chưa có lịch làm việc nào.
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-4">
      {schedules.map((schedule) => {
        const id = schedule._id || "";
        const statusKey = schedule.status || "draft";
        const colorClasses = statusColors[statusKey] ?? statusColors["draft"];
        const [bgClass, txtClass] = colorClasses.split(" ");
        const statusLabel = statusText[statusKey] ?? statusText["draft"];

        return (
          <Pressable
            key={id || schedule.week_start}
            onPress={() =>
              id &&
              router.push({
                pathname: "/(main)/workschedule/user/[id]",
                params: { id },
              } as any)
            }
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex-row justify-between items-center"
            style={({ pressed }) => ({
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <View>
              <Text className="text-base font-semibold mb-1">
                Tuần:{" "}
                {new Date(schedule.week_start).toLocaleDateString("vi-VN")}
              </Text>
              <Text className="text-sm text-gray-500">
                Số ngày đăng ký: {schedule.entries?.length || 0}
              </Text>
            </View>
            <View className={`px-3 py-1 rounded-full ${bgClass}`}>
              <Text className={`text-xs font-medium ${txtClass}`}>
                {statusLabel}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
