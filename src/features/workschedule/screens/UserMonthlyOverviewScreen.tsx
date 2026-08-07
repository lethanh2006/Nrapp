import { useWorkRequests } from "@/src/features/workschedule/hooks/useWorkRequests";
import { useWorkscheduleUser } from "@/src/features/workschedule/hooks/useWorkscheduleUser";
import type {
  IMonthlyScheduleOverview,
  IWorkRequestStats,
} from "@/src/services/workschedule/constant";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import type { ComponentProps } from "react";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

type IconName = ComponentProps<typeof Ionicons>["name"];

const getMonthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

export default function UserMonthlyOverviewScreen() {
  const { getMonthlyOverview } = useWorkscheduleUser();
  const { getStats } = useWorkRequests();
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [schedule, setSchedule] = useState<IMonthlyScheduleOverview | null>(null);
  const [requests, setRequests] = useState<IWorkRequestStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const key = getMonthKey(month);
    const [scheduleData, requestData] = await Promise.all([
      getMonthlyOverview(key),
      getStats(key),
    ]);
    setSchedule(scheduleData);
    setRequests(requestData);
    setLoading(false);
  }, [getMonthlyOverview, getStats, month]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const changeMonth = (offset: number) =>
    setMonth(previous => new Date(previous.getFullYear(), previous.getMonth() + offset, 1));

  const metrics: { label: string; value: number | string; icon: IconName; color: string; box: string }[] = [
    {
      label: "Buổi đăng ký làm",
      value: schedule?.stats.registered_sessions || 0,
      icon: "calendar-outline",
      color: "#2563eb",
      box: "bg-blue-50",
    },
    {
      label: "Buổi đã duyệt",
      value: schedule?.stats.approved_sessions || 0,
      icon: "checkmark-circle-outline",
      color: "#059669",
      box: "bg-emerald-50",
    },
    {
      label: "Xin nghỉ đã duyệt",
      value: requests?.approved_by_type.leave || 0,
      icon: "bed-outline",
      color: "#e11d48",
      box: "bg-rose-50",
    },
    {
      label: "Đi muộn đã duyệt",
      value: requests?.approved_by_type.late || 0,
      icon: "time-outline",
      color: "#d97706",
      box: "bg-amber-50",
    },
    {
      label: "Về sớm đã duyệt",
      value: requests?.approved_by_type.early || 0,
      icon: "exit-outline",
      color: "#ea580c",
      box: "bg-orange-50",
    },
    {
      label: "Giờ OT đã duyệt",
      value: requests?.approved_overtime_hours || 0,
      icon: "flash-outline",
      color: "#7c3aed",
      box: "bg-violet-50",
    },
  ];

  const distribution = [
    { label: "Tại công ty", value: schedule?.stats.office_sessions || 0, color: "bg-blue-500" },
    {
      label: "Remote",
      value: (schedule?.stats.remote_sessions || 0) + (requests?.approved_by_type.remote || 0),
      color: "bg-violet-500",
    },
    { label: "Nghỉ phép", value: schedule?.stats.leave_sessions || 0, color: "bg-orange-500" },
  ];
  const maxDistribution = Math.max(1, ...distribution.map(item => item.value));

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center border-b border-slate-100 bg-white px-4 py-3">
        <Pressable
          className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-slate-100"
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color="#334155" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-lg font-black text-slate-900">Thống kê tháng</Text>
          <Text className="text-[11px] text-slate-500">Lịch làm và đơn từ đã được xử lý</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <View className="mb-4 flex-row items-center justify-between rounded-2xl border border-slate-200 bg-white p-2">
          <Pressable className="h-10 w-10 items-center justify-center" onPress={() => changeMonth(-1)}>
            <Ionicons name="chevron-back" size={20} color="#475569" />
          </Pressable>
          <Text className="text-sm font-black text-slate-800">
            Tháng {month.getMonth() + 1}/{month.getFullYear()}
          </Text>
          <Pressable className="h-10 w-10 items-center justify-center" onPress={() => changeMonth(1)}>
            <Ionicons name="chevron-forward" size={20} color="#475569" />
          </Pressable>
        </View>

        {loading ? (
          <View className="items-center py-24">
            <ActivityIndicator color="#dc2626" />
            <Text className="mt-3 text-xs text-slate-400">Đang tổng hợp dữ liệu...</Text>
          </View>
        ) : (
          <>
            <View className="flex-row flex-wrap justify-between">
              {metrics.map(metric => (
                <View className="mb-3 w-[48.5%] rounded-3xl border border-slate-200 bg-white p-4" key={metric.label}>
                  <View className={`h-9 w-9 items-center justify-center rounded-xl ${metric.box}`}>
                    <Ionicons name={metric.icon} size={18} color={metric.color} />
                  </View>
                  <Text className="mt-3 text-2xl font-black text-slate-900">{metric.value}</Text>
                  <Text className="mt-1 text-[11px] font-semibold leading-4 text-slate-500">
                    {metric.label}
                  </Text>
                </View>
              ))}
            </View>

            <View className="mt-1 rounded-3xl border border-slate-200 bg-white p-4">
              <Text className="text-sm font-black text-slate-800">Phân bổ buổi đã duyệt</Text>
              <Text className="mt-1 text-[11px] text-slate-500">So sánh hình thức làm việc trong tháng</Text>
              <View className="mt-5 gap-4">
                {distribution.map(item => (
                  <View key={item.label}>
                    <View className="mb-2 flex-row items-center justify-between">
                      <Text className="text-xs font-bold text-slate-600">{item.label}</Text>
                      <Text className="text-xs font-black text-slate-800">{item.value}</Text>
                    </View>
                    <View className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <View
                        className={`h-full rounded-full ${item.color}`}
                        style={{ width: `${(item.value / maxDistribution) * 100}%` }}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View className="mt-4 rounded-3xl bg-slate-900 p-4">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-xs font-semibold text-slate-300">Tổng đơn trong tháng</Text>
                  <Text className="mt-1 text-3xl font-black text-white">{requests?.total || 0}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-xs font-bold text-amber-300">Chờ duyệt: {requests?.pending || 0}</Text>
                  <Text className="mt-1 text-xs font-bold text-emerald-300">Đã duyệt: {requests?.approved || 0}</Text>
                  <Text className="mt-1 text-xs font-bold text-rose-300">Từ chối: {requests?.rejected || 0}</Text>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
