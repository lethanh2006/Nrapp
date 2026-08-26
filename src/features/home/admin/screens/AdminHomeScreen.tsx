import {
  canManageAccounts,
  canManageTasks,
  canManageWorkSchedule,
  getRoleLabel,
} from "@/src/application/access/roles";
import { APP_ROUTES } from "@/src/application/navigation/routes";
import { useAuthSession } from "@/src/features/auth/model/AuthSessionContext";
import { useWorkscheduleAdmin } from "@/src/features/workschedule/admin/hooks/useWorkscheduleAdmin";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, type Href } from "expo-router";
import { useCallback, useMemo, useState, type ComponentProps } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type IconName = ComponentProps<typeof Ionicons>["name"];

export default function AdminHomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthSession();
  const { getPendingSchedules, getTodayAttendance } = useWorkscheduleAdmin();
  const [pendingSchedules, setPendingSchedules] = useState(0);
  const [attendanceToday, setAttendanceToday] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const managesSchedule = canManageWorkSchedule(user?.role);

  const loadOverview = useCallback(
    async (refresh = false) => {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      if (managesSchedule) {
        const [pending, attendance] = await Promise.all([
          getPendingSchedules(undefined, true),
          getTodayAttendance(true),
        ]);
        setPendingSchedules(pending.length);
        setAttendanceToday(attendance.length);
      }
      setLoading(false);
      setRefreshing(false);
    },
    [getPendingSchedules, getTodayAttendance, managesSchedule],
  );

  useFocusEffect(
    useCallback(() => {
      void loadOverview();
    }, [loadOverview]),
  );

  const tools = useMemo<
    { title: string; subtitle: string; icon: IconName; route: Href }[]
  >(
    () => [
      {
        title: "Lịch & chấm công",
        subtitle: managesSchedule
          ? `${pendingSchedules} lịch đang chờ duyệt`
          : "Theo dõi lịch làm cá nhân",
        icon: "calendar-outline",
        route: APP_ROUTES.admin.workschedule,
      },
      {
        title: "Điều phối công việc",
        subtitle: canManageTasks(user?.role)
          ? "Tạo, giao và theo dõi tiến độ"
          : "Xem công việc được phân công",
        icon: "checkbox-outline",
        route: APP_ROUTES.admin.todo,
      },
      {
        title: "Vận hành căn tin",
        subtitle: "Thực đơn, kho, bàn và báo cáo",
        icon: "restaurant-outline",
        route: APP_ROUTES.admin.canteen,
      },
      {
        title: "Danh bạ nhân sự",
        subtitle: canManageAccounts(user?.role)
          ? "Quản lý tài khoản và phân quyền"
          : "Tra cứu thông tin nội bộ",
        icon: "people-outline",
        route: APP_ROUTES.admin.directory,
      },
    ],
    [managesSchedule, pendingSchedules, user?.role],
  );

  return (
    <ScrollView
      className="flex-1 bg-slate-950"
      contentContainerStyle={{ paddingBottom: 28 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void loadOverview(true)}
          tintColor="#ef4444"
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View
        className="overflow-hidden border-b border-slate-800 bg-slate-900 px-5 pb-7"
        style={{ paddingTop: insets.top + 18 }}
      >
        <View className="absolute -right-12 -top-14 h-40 w-40 rounded-full bg-red-600/15" />
        <View className="flex-row items-center justify-between">
          <Pressable
            className="flex-1 flex-row items-center"
            onPress={() => router.push(APP_ROUTES.admin.profile)}
          >
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-red-600">
              <Text className="text-xl font-black text-white">
                {(user?.name || "A").charAt(0).toUpperCase()}
              </Text>
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-[10px] font-black uppercase tracking-[2px] text-red-400">
                Bảng điều hành
              </Text>
              <Text className="mt-1 text-xl font-black text-white" numberOfLines={1}>
                {user?.name || "Quản trị viên"}
              </Text>
              <Text className="mt-1 text-xs text-slate-400">{getRoleLabel(user?.role)}</Text>
            </View>
          </Pressable>
          <Pressable
            accessibilityLabel="Mở trò chuyện"
            className="h-11 w-11 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800"
            onPress={() => router.push(APP_ROUTES.admin.chat)}
          >
            <Ionicons name="chatbubbles-outline" size={21} color="#f87171" />
          </Pressable>
        </View>
      </View>

      <View className="px-4 pt-4">
        <View className="mb-4 flex-row" style={{ gap: 10 }}>
          <View className="flex-1 rounded-3xl border border-slate-800 bg-slate-900 p-4">
            <Text className="text-[10px] font-bold uppercase text-slate-500">Chấm công hôm nay</Text>
            {loading ? (
              <ActivityIndicator className="mt-3 self-start" color="#ef4444" />
            ) : (
              <Text className="mt-2 text-3xl font-black text-white">{attendanceToday}</Text>
            )}
            <Text className="mt-1 text-[11px] text-slate-500">Nhân sự đã ghi nhận</Text>
          </View>
          <View className="flex-1 rounded-3xl bg-red-600 p-4">
            <Text className="text-[10px] font-bold uppercase text-red-100">Cần xử lý</Text>
            {loading ? (
              <ActivityIndicator className="mt-3 self-start" color="#fff" />
            ) : (
              <Text className="mt-2 text-3xl font-black text-white">{pendingSchedules}</Text>
            )}
            <Text className="mt-1 text-[11px] text-red-100">Yêu cầu lịch chờ duyệt</Text>
          </View>
        </View>

        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-base font-black text-white">Công cụ quản trị</Text>
          <Pressable onPress={() => router.push(APP_ROUTES.admin.utilities)}>
            <Text className="text-xs font-black text-red-400">Xem tiện ích</Text>
          </Pressable>
        </View>

        <View style={{ gap: 10 }}>
          {tools.map((tool, index) => (
            <Pressable
              className="flex-row items-center rounded-3xl border border-slate-800 bg-slate-900 p-4 active:bg-slate-800"
              key={tool.title}
              onPress={() => router.push(tool.route)}
            >
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15">
                <Ionicons name={tool.icon} size={22} color="#f87171" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-sm font-black text-slate-100">{tool.title}</Text>
                <Text className="mt-1 text-[11px] leading-4 text-slate-500">{tool.subtitle}</Text>
              </View>
              <Text className="mr-2 text-[10px] font-black text-slate-600">
                {String(index + 1).padStart(2, "0")}
              </Text>
              <Ionicons name="chevron-forward" size={17} color="#64748b" />
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
