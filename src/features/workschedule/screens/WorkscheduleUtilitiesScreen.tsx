import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import type { ComponentProps } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

type IconName = ComponentProps<typeof Ionicons>["name"];

const utilities: {
  title: string;
  description: string;
  icon: IconName;
  color: string;
  background: string;
  route: string;
}[] = [
  {
    title: "Đăng ký lịch làm",
    description: "Chọn nơi làm và ca sáng, chiều hoặc cả ngày",
    icon: "calendar-outline",
    color: "#dc2626",
    background: "bg-red-50",
    route: "/(main)/user/workschedule",
  },
  {
    title: "Lịch làm việc",
    description: "Xem lịch tháng, trạng thái duyệt và chi tiết từng ngày",
    icon: "calendar-number-outline",
    color: "#0891b2",
    background: "bg-cyan-50",
    route: "/(main)/user/utilities/calendar",
  },
  {
    title: "Đơn từ",
    description: "Nghỉ, đi muộn, về sớm, OT, công tác và remote",
    icon: "mail-outline",
    color: "#7c3aed",
    background: "bg-violet-50",
    route: "/(main)/user/utilities/requests",
  },
  {
    title: "Thống kê tháng",
    description: "Tổng hợp số buổi làm, remote, nghỉ và đơn đã duyệt",
    icon: "stats-chart-outline",
    color: "#059669",
    background: "bg-emerald-50",
    route: "/(main)/user/utilities/calendar",
  },
];

export default function WorkscheduleUtilitiesScreen() {
  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="mb-5">
        <Text className="text-2xl font-black text-slate-900">Tiện ích nhân sự</Text>
        <Text className="mt-1 text-xs leading-5 text-slate-500">
          Lịch làm việc và các thủ tục thường dùng, gói gọn trong một nơi.
        </Text>
      </View>

      <View className="mb-5 rounded-3xl bg-slate-900 p-5">
        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
          <Ionicons name="sparkles" size={22} color="white" />
        </View>
        <Text className="mt-4 text-lg font-black text-white">Quản lý ngày làm chủ động</Text>
        <Text className="mt-1 text-xs leading-5 text-slate-300">
          Đăng ký đúng ca, theo dõi phê duyệt và xem thống kê trước khi chấm công.
        </Text>
      </View>

      <View className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        {utilities.map((item, index) => (
          <Pressable
            className={`flex-row items-center p-4 active:bg-slate-50 ${
              index < utilities.length - 1 ? "border-b border-slate-100" : ""
            }`}
            key={item.title}
            onPress={() => router.push(item.route as never)}
          >
            <View className={`h-12 w-12 items-center justify-center rounded-2xl ${item.background}`}>
              <Ionicons name={item.icon} size={23} color={item.color} />
            </View>
            <View className="ml-3 flex-1 pr-2">
              <Text className="text-sm font-black text-slate-800">{item.title}</Text>
              <Text className="mt-1 text-[11px] leading-4 text-slate-500">
                {item.description}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
