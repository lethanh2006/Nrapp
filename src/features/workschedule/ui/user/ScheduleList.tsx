import type { IScheduleRequest } from "@/src/services/workschedule/constant";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import type { ComponentProps } from "react";
import React from "react";
import { Pressable, Text, View } from "react-native";

interface Props {
  schedules: IScheduleRequest[];
  onSelectDraft?: (schedule: IScheduleRequest) => void;
}

type IconName = ComponentProps<typeof Ionicons>["name"];

const statusConfig: Record<
  string,
  { label: string; box: string; text: string; icon: IconName; color: string }
> = {
  draft: {
    label: "Bản nháp",
    box: "bg-slate-100",
    text: "text-slate-600",
    icon: "document-text-outline",
    color: "#64748b",
  },
  pending: {
    label: "Đang chờ duyệt",
    box: "bg-amber-50",
    text: "text-amber-700",
    icon: "time-outline",
    color: "#d97706",
  },
  approved: {
    label: "Đã được duyệt",
    box: "bg-emerald-50",
    text: "text-emerald-700",
    icon: "checkmark-circle-outline",
    color: "#059669",
  },
  rejected: {
    label: "Cần xem lại",
    box: "bg-rose-50",
    text: "text-rose-700",
    icon: "alert-circle-outline",
    color: "#e11d48",
  },
};

export default function ScheduleList({ schedules, onSelectDraft }: Props) {
  if (!schedules || schedules.length === 0) {
    return (
      <View className="items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-8">
        <View className="mb-3 h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
          <Ionicons name="calendar-outline" size={23} color="#94a3b8" />
        </View>
        <Text className="text-sm font-black text-slate-700">Chưa có lịch nào</Text>
        <Text className="mt-1 text-center text-xs leading-5 text-slate-400">
          Lịch sau khi lưu hoặc gửi duyệt sẽ xuất hiện tại đây.
        </Text>
      </View>
    );
  }

  const sortedSchedules = [...schedules].sort(
    (left, right) =>
      new Date(right.week_start).getTime() - new Date(left.week_start).getTime(),
  );

  return (
    <View className="gap-3">
      {sortedSchedules.map((schedule) => {
        const id = schedule._id || "";
        const status = statusConfig[schedule.status || "draft"] ?? statusConfig.draft;
        const start = new Date(schedule.week_start);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        const workingDays = (schedule.entries || []).filter(
          (entry) => entry.type === "office" || entry.type === "remote",
        ).length;

        return (
          <Pressable
            key={id || schedule.week_start}
            onPress={() => {
              if (schedule.status === "draft" && onSelectDraft) {
                onSelectDraft(schedule);
                return;
              }
              if (id) {
                router.push({
                  pathname: "/(main)/user/workschedule/[id]",
                  params: { id },
                } as never);
              }
            }}
            className="flex-row items-center rounded-3xl border border-slate-200/80 bg-white p-4 active:opacity-80"
          >
            <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl bg-slate-50">
              <Ionicons name={status.icon} size={21} color={status.color} />
            </View>
            <View className="flex-1 pr-2">
              <Text className="text-sm font-black text-slate-800">
                {start.toLocaleDateString("vi-VN")} - {end.toLocaleDateString("vi-VN")}
              </Text>
              <Text className="mt-1 text-xs text-slate-500">
                {workingDays} ngày làm việc
              </Text>
            </View>
            <View className="items-end">
              <View className={`rounded-full px-2.5 py-1 ${status.box}`}>
                <Text className={`text-[10px] font-black ${status.text}`}>
                  {status.label}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color="#94a3b8"
                style={{ marginTop: 8 }}
              />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
