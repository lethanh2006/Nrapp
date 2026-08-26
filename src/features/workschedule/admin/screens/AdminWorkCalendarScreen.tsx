import {
  type AdminHeatmapRow,
  type AdminScheduleRequest,
  useWorkscheduleAdmin,
} from "@/src/features/workschedule/admin/hooks/useWorkscheduleAdmin";
import { ScreenHeader } from "@/src/shared/ui/ScreenHeader";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";

const mondayOf = (date: Date) => {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));
  result.setHours(0, 0, 0, 0);
  return result;
};

const isoWeek = (date: Date) => {
  const current = new Date(date);
  current.setDate(current.getDate() + 3 - ((current.getDay() + 6) % 7));
  const firstThursday = new Date(current.getFullYear(), 0, 4);
  const week =
    1 +
    Math.round(
      ((current.getTime() - firstThursday.getTime()) / 86400000 -
        3 +
        ((firstThursday.getDay() + 6) % 7)) /
        7,
    );
  return `${current.getFullYear()}-W${String(week).padStart(2, "0")}`;
};

const statusMeta = {
  pending: { label: "Chờ duyệt", box: "bg-amber-500/15", text: "text-amber-400" },
  approved: { label: "Đã duyệt", box: "bg-emerald-500/15", text: "text-emerald-400" },
  rejected: { label: "Từ chối", box: "bg-red-500/15", text: "text-red-400" },
};

export default function AdminWorkCalendarScreen() {
  const { getAllSchedules, getHeatmap } = useWorkscheduleAdmin();
  const [weekOffset, setWeekOffset] = useState(0);
  const [requests, setRequests] = useState<AdminScheduleRequest[]>([]);
  const [heatmap, setHeatmap] = useState<AdminHeatmapRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const selectedMonday = useMemo(() => {
    const result = mondayOf(new Date());
    result.setDate(result.getDate() + weekOffset * 7);
    return result;
  }, [weekOffset]);
  const selectedWeek = useMemo(() => isoWeek(selectedMonday), [selectedMonday]);
  const weekEnd = useMemo(() => {
    const result = new Date(selectedMonday);
    result.setDate(result.getDate() + 6);
    return result;
  }, [selectedMonday]);

  const loadData = useCallback(
    async (refresh = false) => {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      const [scheduleRows, heatmapRows] = await Promise.all([
        getAllSchedules({ week: selectedWeek, status: "all" }, true),
        getHeatmap(selectedWeek, true),
      ]);
      setRequests(scheduleRows);
      setHeatmap(heatmapRows);
      setLoading(false);
      setRefreshing(false);
    },
    [getAllSchedules, getHeatmap, selectedWeek],
  );

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const totals = useMemo(
    () =>
      heatmap.reduce(
        (result, row) => {
          row.stats.forEach((item) => {
            result[item.type] = (result[item.type] || 0) + item.count;
          });
          return result;
        },
        {} as Record<string, number>,
      ),
    [heatmap],
  );

  return (
    <View className="flex-1 bg-slate-950">
      <ScreenHeader
        onBack={() => router.back()}
        subtitle="Lịch đăng ký của toàn bộ nhân sự"
        title="Lịch hệ thống"
      />
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadData(true)}
            tintColor="#ef4444"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View className="rounded-3xl bg-red-600 p-5">
          <Text className="text-[10px] font-black uppercase tracking-[2px] text-red-100">
            Tuần điều hành
          </Text>
          <View className="mt-3 flex-row items-center">
            <Pressable
              accessibilityLabel="Xem tuần trước"
              className="h-10 w-10 items-center justify-center rounded-xl bg-white/15"
              onPress={() => setWeekOffset((value) => value - 1)}
            >
              <Ionicons name="chevron-back" size={19} color="#fff" />
            </Pressable>
            <View className="flex-1 items-center">
              <Text className="text-base font-black text-white">
                {selectedMonday.toLocaleDateString("vi-VN")} – {weekEnd.toLocaleDateString("vi-VN")}
              </Text>
              <Text className="mt-1 text-[10px] font-bold text-red-100">{selectedWeek}</Text>
            </View>
            <Pressable
              accessibilityLabel="Xem tuần sau"
              className="h-10 w-10 items-center justify-center rounded-xl bg-white/15"
              onPress={() => setWeekOffset((value) => value + 1)}
            >
              <Ionicons name="chevron-forward" size={19} color="#fff" />
            </Pressable>
          </View>
        </View>

        {loading ? (
          <View className="items-center py-24">
            <ActivityIndicator color="#ef4444" />
            <Text className="mt-3 text-xs text-slate-400">Đang tải lịch hệ thống...</Text>
          </View>
        ) : (
          <>
            <View className="my-4 flex-row flex-wrap" style={{ gap: 10 }}>
              {[
                ["Tại công ty", totals.office || 0, "business-outline"],
                ["Làm từ xa", totals.remote || 0, "home-outline"],
                ["Nghỉ", totals.day_off || 0, "sunny-outline"],
                ["Nghỉ phép", totals.leave || 0, "cafe-outline"],
              ].map(([label, value, icon]) => (
                <View
                  className="min-w-[46%] flex-1 rounded-2xl border border-slate-800 bg-slate-900 p-4"
                  key={String(label)}
                >
                  <Ionicons name={icon as never} size={18} color="#f87171" />
                  <Text className="mt-2 text-xl font-black text-white">{value}</Text>
                  <Text className="mt-1 text-[10px] font-bold uppercase text-slate-500">{label}</Text>
                </View>
              ))}
            </View>

            <View className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
              <View className="border-b border-slate-800 p-4">
                <Text className="text-base font-black text-white">Đăng ký theo nhân viên</Text>
                <Text className="mt-1 text-xs text-slate-500">{requests.length} yêu cầu trong tuần</Text>
              </View>
              {requests.length === 0 ? (
                <View className="items-center px-5 py-10">
                  <Ionicons name="calendar-clear-outline" size={30} color="#64748b" />
                  <Text className="mt-3 text-sm font-bold text-slate-400">Chưa có đăng ký</Text>
                </View>
              ) : (
                requests.map((request, index) => {
                  const status = statusMeta[request.status];
                  const name =
                    request.employee?.name ||
                    request.employee?.username ||
                    request.employee?.email ||
                    "Nhân viên";
                  return (
                    <View
                      className={`flex-row items-center p-4 ${index < requests.length - 1 ? "border-b border-slate-800" : ""}`}
                      key={request._id}
                    >
                      <View className="h-10 w-10 items-center justify-center rounded-xl bg-slate-800">
                        <Ionicons name="person-outline" size={18} color="#cbd5e1" />
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="text-sm font-black text-slate-100">{name}</Text>
                        <Text className="mt-1 text-[11px] text-slate-500">
                          {(request.entries || []).length} ngày đăng ký
                        </Text>
                      </View>
                      <View className={`rounded-full px-2.5 py-1 ${status.box}`}>
                        <Text className={`text-[10px] font-black ${status.text}`}>{status.label}</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
