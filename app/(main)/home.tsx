import { useAppData } from "@/context/AppContext";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
import {
  Alert,
  Dimensions,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWorkscheduleUser } from "@/hooks/useWorkscheduleUser";
import { IScheduleRequest, IScheduleEntry } from "@/components/workschedule/types";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAppData();
  const isAdmin = user?.role === "admin";
  const [todayDate, setTodayDate] = useState(new Date());

  const { getMySchedules, loading } = useWorkscheduleUser();
  const [currentWeekSchedule, setCurrentWeekSchedule] = useState<IScheduleRequest | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTodayDate(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - (day === 0 ? 6 : day - 1);
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  useFocusEffect(
    useCallback(() => {
      if (isAdmin) {
        setHasLoaded(true);
        return;
      }
      let isActive = true;
      const loadSchedule = async () => {
        const schedules = await getMySchedules();
        if (!isActive) return;

        const thisWeekMonday = getMonday(new Date());
        const found = schedules.find((s) => {
          const sDate = new Date(s.week_start);
          return isSameDay(sDate, thisWeekMonday);
        });

        setCurrentWeekSchedule(found || null);
        setHasLoaded(true);
      };

      loadSchedule();
      return () => {
        isActive = false;
      };
    }, [getMySchedules, isAdmin])
  );

  const getVietnameseDayName = (date: Date) => {
    const days = [
      "CHỦ NHẬT",
      "THỨ HAI",
      "THỨ BA",
      "THỨ TƯ",
      "THỨ NĂM",
      "THỨ SÁU",
      "THỨ BẢY",
    ];
    return days[date.getDay()];
  };

  const getVietnameseFullDate = (date: Date) => {
    const dayName = getVietnameseDayName(date);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    return `${dayName}, ${day} THÁNG ${month < 10 ? "0" + month : month}`;
  };

  const tomorrow = new Date(todayDate.getTime() + 24 * 60 * 60 * 1000);

  const renderScheduleBox = (entry: IScheduleEntry | undefined) => {
    if (!entry) {
      return (
        <View className="bg-slate-50 border border-slate-100 rounded-xl p-2">
          <Text className="text-slate-500 text-[11px] font-extrabold leading-tight">
            Nghỉ ngơi
          </Text>
          <Text className="text-slate-400 text-[9px] font-semibold mt-1">
            Không có lịch làm việc
          </Text>
        </View>
      );
    }

    switch (entry.type) {
      case "office":
        return (
          <View className="bg-blue-50/70 border-l-4 border-blue-500 rounded-r-xl p-2">
            <Text className="text-blue-900 text-[11px] font-extrabold leading-tight">
              Lên công ty
            </Text>
            <Text className="text-blue-700 text-[9px] font-bold mt-1">
              08:30 - 17:30
            </Text>
            <Text className="text-blue-500 text-[9px] font-semibold mt-0.5" numberOfLines={1}>
              {entry.note || "Gaming Studio 1"}
            </Text>
          </View>
        );
      case "remote":
        return (
          <View className="bg-purple-50/70 border-l-4 border-purple-500 rounded-r-xl p-2">
            <Text className="text-purple-900 text-[11px] font-extrabold leading-tight">
              Làm việc từ xa
            </Text>
            <Text className="text-purple-700 text-[9px] font-bold mt-1">
              08:30 - 17:30
            </Text>
            <Text className="text-purple-500 text-[9px] font-semibold mt-0.5" numberOfLines={1}>
              {entry.note || "Online qua Slack/Meet"}
            </Text>
          </View>
        );
      case "day_off":
        return (
          <View className="bg-slate-50 border border-slate-200 rounded-xl p-2">
            <Text className="text-slate-700 text-[11px] font-extrabold leading-tight">
              Ngày nghỉ
            </Text>
            <Text className="text-slate-500 text-[9px] font-bold mt-1">
              Cả ngày
            </Text>
            <Text className="text-slate-400 text-[9px] font-semibold mt-0.5" numberOfLines={1}>
              {entry.note || "Nghỉ tuần"}
            </Text>
          </View>
        );
      case "leave":
        return (
          <View className="bg-orange-50 border border-orange-200 rounded-xl p-2">
            <Text className="text-orange-800 text-[11px] font-extrabold leading-tight">
              Nghỉ phép
            </Text>
            <Text className="text-orange-600 text-[9px] font-bold mt-1">
              Cả ngày
            </Text>
            <Text className="text-orange-500 text-[9px] font-semibold mt-0.5" numberOfLines={1}>
              {entry.note || "Đã đăng ký phép"}
            </Text>
          </View>
        );
      default:
        return (
          <View className="bg-slate-50 border border-slate-100 rounded-xl p-2">
            <Text className="text-slate-500 text-[11px] font-extrabold leading-tight">
              Nghỉ ngơi
            </Text>
            <Text className="text-slate-400 text-[9px] font-semibold mt-1">
              Không có lịch làm việc
            </Text>
          </View>
        );
    }
  };

  const todayEntry = currentWeekSchedule?.entries?.find(e => isSameDay(new Date(e.date), todayDate));
  const tomorrowEntry = currentWeekSchedule?.entries?.find(e => isSameDay(new Date(e.date), tomorrow));

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      showsVerticalScrollIndicator={false}
    >
      <ImageBackground
        source={require("@/assets/images/bg1.png")}
        className="w-full relative overflow-hidden"
        style={{
          paddingTop: insets.top + 16,
          paddingBottom: 48,
        }}
        resizeMode="cover"
      >
        <View className="absolute inset-0 bg-red-950/20" />

        <View className="flex-row items-center justify-between px-4 z-10">
          <View className="flex-row items-center flex-1 mr-3">
            <View className="w-13 h-13 rounded-full bg-white/20 border-2 border-white items-center justify-center overflow-hidden">
              <Text className="text-white text-xl font-black">
                {user?.name ? user.name.charAt(0).toUpperCase() : "H"}
              </Text>
            </View>

            <View className="ml-3 flex-1 justify-center">
              <Text
                className="text-white text-lg font-black tracking-wide"
                numberOfLines={1}
              >
                {user?.name}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center space-x-2">
            <Pressable
              onPress={() =>
                Alert.alert(
                  "Tìm kiếm nhanh",
                  "Tính năng tìm kiếm nhanh nhân viên và dự án sắp ra mắt!"
                )
              }
              className="w-10 h-10 rounded-full bg-white/15 items-center justify-center active:scale-95"
            >
              <Ionicons name="search" size={20} color="white" />
            </Pressable>

            <Pressable
              onPress={() => router.push("/(main)/workschedule")}
              className="w-10 h-10 rounded-full bg-white/15 items-center justify-center active:scale-95"
            >
              <Ionicons name="calendar" size={20} color="white" />
            </Pressable>
          </View>
        </View>
      </ImageBackground>

      {!isAdmin && !currentWeekSchedule && hasLoaded ? (
        <View
          className="mx-4 bg-white rounded-3xl p-5 -mt-8 shadow-md border border-slate-100 items-center justify-center min-h-[110px]"
          style={{
            elevation: 4,
          }}
        >
          <Ionicons name="calendar-outline" size={28} color="#94a3b8" className="mb-1.5" />
          <Text className="text-slate-500 text-xs font-bold text-center">
            Bạn không có lịch trong tuần này
          </Text>
          <Pressable
            onPress={() => router.push("/(main)/workschedule/user/create")}
            className="mt-2 bg-blue-50 px-4 py-1.5 rounded-full active:scale-95 flex-row items-center space-x-1"
          >
            <Ionicons name="add-circle" size={14} color="#2563eb" />
            <Text className="text-blue-600 text-[10px] font-extrabold uppercase tracking-wider ml-0.5">
              Đăng ký lịch ngay
            </Text>
          </Pressable>
        </View>
      ) : (
        <View
          className="mx-4 bg-white rounded-3xl p-5 -mt-8 shadow-md border border-slate-100 flex-row justify-between min-h-[110px]"
          style={{
            elevation: 4,
          }}
        >
          {loading && !hasLoaded && !isAdmin ? (
            <View className="flex-1 items-center justify-center py-4">
              <ActivityIndicator size="small" color="#3b82f6" />
            </View>
          ) : (
            <>
              <View className="flex-1 pr-4 border-r border-slate-100">
                <Text className="text-rose-600 text-xs font-black tracking-wider uppercase mb-1">
                  {getVietnameseDayName(todayDate)}
                </Text>
                <Text className="text-slate-800 text-4xl font-black tracking-tighter mb-3">
                  {todayDate.getDate()}
                </Text>
                {isAdmin ? (
                  <View className="bg-rose-50/70 border-l-4 border-rose-500 rounded-r-xl p-2">
                    <Text className="text-rose-900 text-[11px] font-extrabold leading-tight">
                      Lịch trình Admin
                    </Text>
                    <Text className="text-rose-700 text-[9px] font-bold mt-1">
                      Linh hoạt
                    </Text>
                    <Text className="text-rose-500 text-[9px] font-semibold mt-0.5" numberOfLines={1}>
                      Quyền Quản Lý / Điều Hành
                    </Text>
                  </View>
                ) : (
                  renderScheduleBox(todayEntry)
                )}
              </View>
              <View className="flex-1 pl-4 justify-between">
                <Text className="text-slate-400 text-[10px] font-extrabold uppercase tracking-wider mb-2">
                  {getVietnameseFullDate(tomorrow)}
                </Text>
                {isAdmin ? (
                  <View className="bg-rose-50/70 border-l-4 border-rose-500 rounded-r-xl p-2">
                    <Text className="text-rose-900 text-[11px] font-extrabold leading-tight">
                      Lịch trình Admin
                    </Text>
                    <Text className="text-rose-700 text-[9px] font-bold mt-1">
                      Linh hoạt
                    </Text>
                    <Text className="text-rose-500 text-[9px] font-semibold mt-0.5" numberOfLines={1}>
                      Quyền Quản Lý / Điều Hành
                    </Text>
                  </View>
                ) : (
                  renderScheduleBox(tomorrowEntry)
                )}
              </View>
            </>
          )}
        </View>
      )}

      <View className="p-4 space-y-5">
        <View className="mt-2">
          <View className="flex-row items-center justify-between mb-3.5">
            <Text className="text-base font-black text-slate-800 tracking-tight">
              Chức năng
            </Text>
          </View>

          <View className="flex-row justify-between items-center bg-white p-4 rounded-3xl border border-slate-100/80 shadow-xs">
            <Pressable
              onPress={() => router.push("/(main)/chat")}
              className="items-center justify-center flex-1"
            >
              <View className="w-14 h-14 bg-blue-50 rounded-2xl items-center justify-center shadow-xs active:scale-95 transition-all">
                <Ionicons name="chatbubbles" size={24} color="#3b82f6" />
              </View>
              <Text className="text-[11px] text-slate-700 font-extrabold text-center mt-2.5">
                Trò chuyện
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.push("/(main)/todo")}
              className="items-center justify-center flex-1"
            >
              <View className="w-14 h-14 bg-emerald-50 rounded-2xl items-center justify-center shadow-xs active:scale-95 transition-all">
                <Ionicons name="checkbox" size={24} color="#10b981" />
              </View>
              <Text className="text-[11px] text-slate-700 font-extrabold text-center mt-2.5">
                Nhiệm vụ
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.push("/(main)/workschedule")}
              className="items-center justify-center flex-1"
            >
              <View className="w-14 h-14 bg-purple-50 rounded-2xl items-center justify-center shadow-xs active:scale-95 transition-all">
                <Ionicons name="calendar-sharp" size={24} color="#a855f7" />
              </View>
              <Text className="text-[11px] text-slate-700 font-extrabold text-center mt-2.5">
                Lịch biểu
              </Text>
            </Pressable>
          </View>
        </View>

        <View className="mt-1">
          <View className="flex-row items-center justify-between mb-3.5">
            <Text className="text-base font-black text-slate-800 tracking-tight">
              Tin tức
            </Text>
          </View>

          <View className="space-y-3">
            <Pressable
              onPress={() =>
                Alert.alert(
                  "Công bố Game mới RPG Thần Thoại",
                  "Dự án game nhập vai 'Thần Thoại Việt' sử dụng công nghệ đồ họa Unreal Engine 5 đỉnh cao đã chính thức công bố thử nghiệm bản Alpha Test cho nhân viên nội bộ trải nghiệm. Hãy cùng tải game và đóng góp ý kiến để hoàn thiện siêu phẩm nhé!"
                )
              }
              className="flex-row bg-white rounded-3xl p-3 border border-slate-100/80 shadow-xs items-center active:scale-[0.98]"
            >
              <View className="w-18 h-18 bg-rose-500 rounded-2xl items-center justify-center overflow-hidden">
                <Ionicons name="game-controller" size={32} color="white" />
              </View>

              <View className="flex-1 ml-3.5 justify-center">
                <Text
                  className="text-[12px] font-black text-slate-800 leading-tight mb-1"
                  numberOfLines={2}
                >
                  HDG Studio công bố thử nghiệm Alpha Test dự án Game RPG mới!
                </Text>
                <Text
                  className="text-[10px] text-slate-400 font-bold leading-normal"
                  numberOfLines={2}
                >
                  Đội ngũ Game Dev của HDG vừa hé lộ các hình ảnh đồ họa cực khủng của game nhập vai đỉnh cao...
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() =>
                Alert.alert(
                  "Đăng ký Teambuilding 2026",
                  "Chào hè rực rỡ, HDG Studio tổ chức chuyến teambuilding 4 ngày 3 đêm hoành tráng tại Nha Trang cho toàn thể anh em nhân viên từ ngày 15/06 - 18/06. Vui lòng đăng ký tham gia với phòng Nhân sự trước thứ Sáu để ban tổ chức chuẩn bị xe và phòng khách sạn chu đáo nhất!"
                )
              }
              className="flex-row bg-white rounded-3xl p-3 border border-slate-100/80 shadow-xs items-center active:scale-[0.98]"
            >
              <View className="w-18 h-18 bg-cyan-500 rounded-2xl items-center justify-center overflow-hidden">
                <Ionicons name="sunny" size={32} color="white" />
              </View>

              <View className="flex-1 ml-3.5 justify-center">
                <Text
                  className="text-[12px] font-black text-slate-800 leading-tight mb-1"
                  numberOfLines={2}
                >
                  Đăng ký ngay Teambuilding Hè 2026 tại Nha Trang hoành tráng!
                </Text>
                <Text
                  className="text-[10px] text-slate-400 font-bold leading-normal"
                  numberOfLines={2}
                >
                  Chương trình du lịch gắn kết, giao lưu âm nhạc và các thử thách đồng đội hấp dẫn đang chờ đón...
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() =>
                Alert.alert(
                  "HDG Marathon 2026",
                  "Phát động giải chạy bộ HDG Marathon 2026 cự ly 5km - 10km - 21km dành cho tất cả thành viên công ty. Hoạt động nhằm cổ vũ lối sống lành mạnh, rèn luyện sức bền bỉ kiên trì. Cơ cấu giải thưởng siêu lớn với huy chương thiết kế độc quyền từ HDG!"
                )
              }
              className="flex-row bg-white rounded-3xl p-3 border border-slate-100/80 shadow-xs items-center active:scale-[0.98]"
            >
              <View className="w-18 h-18 bg-amber-500 rounded-2xl items-center justify-center overflow-hidden">
                <Ionicons name="footsteps" size={32} color="white" />
              </View>

              <View className="flex-1 ml-3.5 justify-center">
                <Text
                  className="text-[12px] font-black text-slate-800 leading-tight mb-1"
                  numberOfLines={2}
                >
                  Phát động giải chạy marathon HDG Run 2026 - Rèn luyện sức khỏe!
                </Text>
                <Text
                  className="text-[10px] text-slate-400 font-bold leading-normal"
                  numberOfLines={2}
                >
                  Cự ly linh hoạt dành cho nam nữ, tặng áo thun chạy bộ cao cấp cùng huy chương lưu niệm hoàn thành...
                </Text>
              </View>
            </Pressable>
          </View>
        </View>

      </View>
    </ScrollView>
  );
}
