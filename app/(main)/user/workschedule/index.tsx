import ScheduleList from "@/src/features/workschedule/ui/user/ScheduleList";
import { useWorkscheduleUser } from "@/src/features/workschedule/api/useUserWorkscheduleApi";
import { IScheduleRequest, IScheduleEntry, EntryType, IWorkPolicy } from "@/src/features/workschedule/model/workschedule.types";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Options for Schedule Types
const typeOptions: { value: EntryType; label: string; color: string; bg: string; border: string; icon: string }[] = [
  { value: "office", label: "Lên cty", color: "text-blue-700", bg: "bg-blue-50/80", border: "border-blue-200", icon: "business" },
  { value: "remote", label: "Từ xa", color: "text-purple-700", bg: "bg-purple-50/80", border: "border-purple-200", icon: "home" },
  { value: "day_off", label: "Nghỉ", color: "text-slate-500", bg: "bg-slate-50/80", border: "border-slate-200", icon: "sunny" },
  { value: "leave", label: "Phép", color: "text-orange-700", bg: "bg-orange-50/80", border: "border-orange-200", icon: "cafe" },
];

const dayNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

// Helper to get local YYYY-MM-DD string
const toLocalISOString = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper to get Monday of a week
const getWeekStartMonday = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - (day === 0 ? 6 : day - 1);
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

export default function WorkscheduleUserDashboard() {
  const { getMySchedules, createRequest, updateEntries, getPolicy, loading } = useWorkscheduleUser();
  const [schedules, setSchedules] = useState<IScheduleRequest[]>([]);
  const [policy, setPolicy] = useState<IWorkPolicy | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);

  const formatDateVi = (dateVal: string | Date | undefined) => {
    if (!dateVal) return "";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const formatDateTimeVi = (dateVal: string | Date | undefined) => {
    if (!dateVal) return "";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${min} - ${dd}/${mm}/${yyyy}`;
  };

  const isOutsideRegistrationWindow = useMemo(() => {
    if (!policy) return false;
    if (policy.locked) return true;
    const now = new Date();
    const start = new Date(policy.registration_start);
    const end = new Date(policy.registration_end);
    return now < start || now > end;
  }, [policy]);

  const allowedWeeksRange = useMemo(() => {
    const now = new Date();
    const currentWeekMon = getWeekStartMonday(now);
    const maxAllowedWeekMon = new Date(currentWeekMon);
    maxAllowedWeekMon.setDate(maxAllowedWeekMon.getDate() + 28);
    return {
      start: currentWeekMon,
      end: maxAllowedWeekMon,
    };
  }, []);

  // View Mode: "calendar" or "list"
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");

  // Selected Month & Year
  const [currentDate, setCurrentDate] = useState(new Date());
  const selectedMonth = currentDate.getMonth();
  const selectedYear = currentDate.getFullYear();

  // Selected Date on Calendar
  const [selectedDateStr, setSelectedDateStr] = useState<string>(toLocalISOString(new Date()));

  // Local modifications state
  const [modifiedEntries, setModifiedEntries] = useState<Record<string, { type: EntryType | undefined; note: string }>>({});
  const [saving, setSaving] = useState(false);

  // Load user schedules
  const loadData = useCallback(async () => {
    const [data, policyData] = await Promise.all([
      getMySchedules(),
      getPolicy()
    ]);
    setSchedules(data);
    setPolicy(policyData);
    setInitialLoad(false);
  }, [getMySchedules, getPolicy]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      if (isActive) {
        loadData();
      }
      return () => {
        isActive = false;
      };
    }, [loadData])
  );

  // Map schedules for fast date lookup
  const scheduleMap = useMemo(() => {
    const map: Record<string, { entry: IScheduleEntry; status: string; requestId: string }> = {};
    schedules.forEach((s) => {
      const reqId = s._id || "";
      const reqStatus = s.status || "draft";
      s.entries?.forEach((e) => {
        const dStr = toLocalISOString(new Date(e.date));
        map[dStr] = { entry: e, status: reqStatus, requestId: reqId };
      });
    });
    return map;
  }, [schedules]);

  // Generate 42 days for the calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    const firstDayIndex = firstDay.getDay(); // 0 for Sunday, 1 for Monday, etc.
    const startDayOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const startDate = new Date(selectedYear, selectedMonth, 1);
    startDate.setDate(startDate.getDate() - startDayOffset);

    const days = [];
    const tempDate = new Date(startDate);
    for (let i = 0; i < 42; i++) {
      days.push(new Date(tempDate));
      tempDate.setDate(tempDate.getDate() + 1);
    }
    return days;
  }, [selectedMonth, selectedYear]);


  const canGoNextMonth = useMemo(() => {
    const maxDate = new Date(allowedWeeksRange.end.getFullYear(), allowedWeeksRange.end.getMonth(), 1);
    const currentDisplayedDate = new Date(selectedYear, selectedMonth, 1);
    return currentDisplayedDate < maxDate;
  }, [selectedMonth, selectedYear, allowedWeeksRange]);


  const handlePrevMonth = () => {
    setCurrentDate(new Date(selectedYear, selectedMonth - 1, 1));
    const firstDayStr = toLocalISOString(new Date(selectedYear, selectedMonth - 1, 1));
    setSelectedDateStr(firstDayStr);
  };

  const handleNextMonth = () => {
    if (!canGoNextMonth) return;
    setCurrentDate(new Date(selectedYear, selectedMonth + 1, 1));
    const firstDayStr = toLocalISOString(new Date(selectedYear, selectedMonth + 1, 1));
    setSelectedDateStr(firstDayStr);
  };

  // Get active selected date properties
  const selectedDate = useMemo(() => new Date(selectedDateStr), [selectedDateStr]);
  const isSelectedDateInPast = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate < today;
  }, [selectedDate]);

  const selectedDateEntry = useMemo(() => {
    if (modifiedEntries[selectedDateStr]) {
      return {
        ...modifiedEntries[selectedDateStr],
        date: selectedDateStr,
      };
    }
    return scheduleMap[selectedDateStr]?.entry || {
      date: selectedDateStr,
      type: undefined,
      note: "",
    };
  }, [selectedDateStr, modifiedEntries, scheduleMap]);

  const selectedDateWeekStatus = useMemo(() => {
    return scheduleMap[selectedDateStr]?.status || "none";
  }, [selectedDateStr, scheduleMap]);

  // Is selected week editable
  const isSelectedWeekReadOnly = useMemo(() => {
    return selectedDateWeekStatus === "approved" || selectedDateWeekStatus === "pending";
  }, [selectedDateWeekStatus]);

  const isSelectedWeekAllowed = useMemo(() => {
    const monday = getWeekStartMonday(selectedDate);
    return monday >= allowedWeeksRange.start && monday <= allowedWeeksRange.end;
  }, [selectedDate, allowedWeeksRange]);

  const isSelectedDateReadOnly = useMemo(() => {
    if (isSelectedDateInPast) return true;
    if (isOutsideRegistrationWindow) return true;
    if (isSelectedWeekReadOnly) return true;
    if (!isSelectedWeekAllowed) return true;
    return false;
  }, [isSelectedDateInPast, isOutsideRegistrationWindow, isSelectedWeekReadOnly, isSelectedWeekAllowed]);

  const readOnlyReason = useMemo(() => {
    if (isSelectedDateInPast) {
      return "Ngày đã trôi qua (Không thể chỉnh sửa)";
    }
    if (isOutsideRegistrationWindow) {
      return "Hệ thống đang khóa cổng đăng ký";
    }
    if (isSelectedWeekReadOnly) {
      if (selectedDateWeekStatus === "approved") {
        return "Lịch tuần này đã được duyệt";
      }
      if (selectedDateWeekStatus === "pending") {
        return "Lịch tuần này đang chờ duyệt";
      }
    }
    if (!isSelectedWeekAllowed) {
      return "Nằm ngoài phạm vi tuần được đăng ký";
    }
    return null;
  }, [isSelectedDateInPast, isOutsideRegistrationWindow, isSelectedWeekReadOnly, selectedDateWeekStatus, isSelectedWeekAllowed]);

  // Modify schedule locally
  const handleUpdateLocalEntry = (field: "type" | "note", value: string) => {
    if (isSelectedDateReadOnly) return;
    setModifiedEntries((prev) => ({
      ...prev,
      [selectedDateStr]: {
        type: field === "type" ? (value as EntryType) : (prev[selectedDateStr]?.type || selectedDateEntry.type),
        note: field === "note" ? value : (prev[selectedDateStr]?.note || selectedDateEntry.note || ""),
      },
    }));
  };

  // Calculate breakdown counts of registered statuses for the selected calendar month
  const monthStats = useMemo(() => {
    let office = 0;
    let remote = 0;
    let day_off = 0;

    for (let day = 1; day <= 31; day++) {
      const d = new Date(selectedYear, selectedMonth, day);
      if (d.getMonth() !== selectedMonth) break;
      const dStr = toLocalISOString(d);

      const entry = modifiedEntries[dStr] || scheduleMap[dStr]?.entry;
      if (entry) {
        if (entry.type === "office") office++;
        else if (entry.type === "remote") remote++;
        else day_off++;
      } else {
        day_off++;
      }
    }

    return { office, remote, day_off };
  }, [selectedMonth, selectedYear, modifiedEntries, scheduleMap]);

  // Group changed entries by week and persist to backend
  const handleSaveDraft = async () => {
    if (isOutsideRegistrationWindow) {
      Alert.alert("Lỗi", "Ngoài khoảng thời gian đăng ký lịch làm việc");
      return false;
    }
    try {
      setSaving(true);
      // Ensure the currently selected date is saved even if modifiedEntries is empty
      const currentType = modifiedEntries[selectedDateStr]?.type || scheduleMap[selectedDateStr]?.entry?.type || "day_off";
      const entriesToSave = { ...modifiedEntries };
      if (!entriesToSave[selectedDateStr]) {
        entriesToSave[selectedDateStr] = {
          type: currentType,
          note: selectedDateEntry.note || "",
        };
      }

      // Group dates by their start Monday
      const weekGroups: Record<string, Record<string, { type: EntryType | undefined; note: string }>> = {};
      Object.keys(entriesToSave).forEach((dateStr) => {
        const monday = getWeekStartMonday(new Date(dateStr));
        const mondayStr = toLocalISOString(monday);
        if (!weekGroups[mondayStr]) weekGroups[mondayStr] = {};
        weekGroups[mondayStr][dateStr] = entriesToSave[dateStr];
      });

      let allSuccess = true;

      // Persist week by week
      const groupMondays = Object.keys(weekGroups);
      for (const mondayStr of groupMondays) {
        const monday = new Date(mondayStr);
        // Build 7 entries for this week
        const weekEntries: IScheduleEntry[] = Array.from({ length: 7 }).map((_, i) => {
          const temp = new Date(monday);
          temp.setDate(temp.getDate() + i);
          const tempStr = toLocalISOString(temp);

          // Local modifications first, then backend entry map, then default
          if (weekGroups[mondayStr][tempStr]) {
            return {
              date: tempStr,
              type: weekGroups[mondayStr][tempStr].type || "day_off",
              note: weekGroups[mondayStr][tempStr].note || "",
            };
          }
          if (scheduleMap[tempStr]?.entry) {
            return {
              date: tempStr,
              type: scheduleMap[tempStr].entry.type || "day_off",
              note: scheduleMap[tempStr].entry.note || "",
            };
          }
          return {
            date: tempStr,
            type: "day_off",
            note: "",
          };
        });

        // Check if there is an existing ScheduleRequest for this week
        const existingReq = schedules.find((s) => {
          const reqMon = getWeekStartMonday(new Date(s.week_start));
          return toLocalISOString(reqMon) === mondayStr;
        });

        if (existingReq) {
          if (existingReq.status === "draft") {
            const success = await updateEntries(existingReq._id, weekEntries, false);
            if (!success) {
              allSuccess = false;
            }
          }
        } else {
          const result = await createRequest(monday.toISOString(), weekEntries, false);
          if (!result) {
            allSuccess = false;
          }
        }
      }

      if (allSuccess) {
        setModifiedEntries({});
        await loadData();
        Alert.alert("Thành công", "Đã lưu nháp lịch làm việc thành công!");
        return true;
      } else {
        await loadData();
        return false;
      }
    } catch {
      Alert.alert("Lỗi", "Không thể lưu lịch làm việc");
      return false;
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      {/* View Mode and Top Header */}
      <View className="bg-white px-4 pt-3 pb-4 border-b border-slate-100 flex-row justify-between items-center z-10 shadow-xs">
        <View>
          <Text className="text-xs text-slate-400 font-extrabold uppercase tracking-wider">Lịch làm việc</Text>
          <Text className="text-xl font-black text-slate-900">
            Tháng {selectedMonth + 1}, {selectedYear}
          </Text>
        </View>

        {/* View mode switcher */}
        <View className="flex-row bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <Pressable
            onPress={() => setViewMode("calendar")}
            className={`px-3 py-1.5 rounded-xl flex-row items-center space-x-1 ${viewMode === "calendar" ? "bg-white shadow-xs" : ""}`}
          >
            <Ionicons name="calendar-sharp" size={14} color={viewMode === "calendar" ? "#2563eb" : "#64748b"} />
            <Text className={`text-xs font-bold ${viewMode === "calendar" ? "text-blue-600" : "text-slate-500"}`}>Lịch</Text>
          </Pressable>

          <Pressable
            onPress={() => setViewMode("list")}
            className={`px-3 py-1.5 rounded-xl flex-row items-center space-x-1 ${viewMode === "list" ? "bg-white shadow-xs" : ""}`}
          >
            <Ionicons name="list" size={14} color={viewMode === "list" ? "#2563eb" : "#64748b"} />
            <Text className={`text-xs font-bold ${viewMode === "list" ? "text-blue-600" : "text-slate-500"}`}>Tuần</Text>
          </Pressable>
        </View>
      </View>

      {initialLoad && loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-slate-400 font-medium mt-3">Đang tải lịch biểu...</Text>
        </View>
      ) : viewMode === "list" ? (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {policy && (
            <View className="mb-4 p-4 rounded-3xl border border-slate-200/80 bg-white shadow-xs">
              <View className="flex-row items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <View className="flex-row items-center space-x-2">
                  <View className="bg-blue-50 p-1.5 rounded-xl">
                    <Ionicons name="information-circle-outline" size={16} color="#2563eb" />
                  </View>
                  <Text className="text-xs font-black text-slate-800 ml-1.5">Thông tin đăng ký lịch</Text>
                </View>
                <View className={`px-2.5 py-0.5 rounded-full border ${isOutsideRegistrationWindow ? "bg-rose-50 border-rose-100" : "bg-emerald-50 border-emerald-100"}`}>
                  <Text className={`text-[10px] font-black uppercase ${isOutsideRegistrationWindow ? "text-rose-600" : "text-emerald-600"}`}>
                    {isOutsideRegistrationWindow ? "Đang Khóa" : "Đang Mở"}
                  </Text>
                </View>
              </View>

              <View style={{ gap: 12 }}>
                <View className="flex-row items-start space-x-3">
                  <View className="bg-slate-50 p-2 rounded-2xl border border-slate-100 mt-0.5">
                    <Ionicons name="time-outline" size={16} color="#64748b" />
                  </View>
                  <View className="flex-1 ml-2">
                    <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Thời gian mở cổng đăng ký</Text>
                    <Text className="text-xs font-bold text-slate-700 mt-0.5">
                      Từ {formatDateTimeVi(policy.registration_start)} đến {formatDateTimeVi(policy.registration_end)}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-start space-x-3">
                  <View className="bg-slate-50 p-2 rounded-2xl border border-slate-100 mt-0.5">
                    <Ionicons name="calendar-outline" size={16} color="#64748b" />
                  </View>
                  <View className="flex-1 ml-2">
                    <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Phạm vi các tuần được đăng ký</Text>
                    <Text className="text-xs font-bold text-slate-700 mt-0.5">
                      Tuần từ <Text className="text-blue-600 font-extrabold">{formatDateVi(allowedWeeksRange.start)}</Text> đến tuần <Text className="text-blue-600 font-extrabold">{formatDateVi(allowedWeeksRange.end)}</Text>
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-base font-bold text-slate-800">Tất cả lịch tuần đã tạo</Text>
            <Pressable
              onPress={() => {
                if (isOutsideRegistrationWindow) {
                  Alert.alert("Thông báo", "Hiện đang ngoài khoảng thời gian đăng ký lịch làm việc");
                  return;
                }
                router.push("/(main)/user/workschedule");
              }}
              className={`px-4 py-2 rounded-xl flex-row items-center ${isOutsideRegistrationWindow ? "bg-slate-300" : "bg-blue-600"}`}
            >
              <Ionicons name="add-outline" size={16} color="white" />
              <Text className="text-white text-xs font-bold ml-1">Đăng ký mới</Text>
            </Pressable>
          </View>
          <ScheduleList schedules={schedules} />
        </ScrollView>
      ) : (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {policy && (
            <View className="mx-4 mt-4 p-4 rounded-3xl border border-slate-200/80 bg-white shadow-xs">
              <View className="flex-row items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <View className="flex-row items-center space-x-2">
                  <View className="bg-blue-50 p-1.5 rounded-xl">
                    <Ionicons name="information-circle-outline" size={16} color="#2563eb" />
                  </View>
                  <Text className="text-xs font-black text-slate-800 ml-1.5">Thông tin đăng ký lịch</Text>
                </View>
                <View className={`px-2.5 py-0.5 rounded-full border ${isOutsideRegistrationWindow ? "bg-rose-50 border-rose-100" : "bg-emerald-50 border-emerald-100"}`}>
                  <Text className={`text-[10px] font-black uppercase ${isOutsideRegistrationWindow ? "text-rose-600" : "text-emerald-600"}`}>
                    {isOutsideRegistrationWindow ? "Đang Khóa" : "Đang Mở"}
                  </Text>
                </View>
              </View>

              <View style={{ gap: 12 }}>
                <View className="flex-row items-start space-x-3">
                  <View className="bg-slate-50 p-2 rounded-2xl border border-slate-100 mt-0.5">
                    <Ionicons name="time-outline" size={16} color="#64748b" />
                  </View>
                  <View className="flex-1 ml-2">
                    <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Thời gian mở cổng đăng ký</Text>
                    <Text className="text-xs font-bold text-slate-700 mt-0.5">
                      Từ {formatDateTimeVi(policy.registration_start)} đến {formatDateTimeVi(policy.registration_end)}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-start space-x-3">
                  <View className="bg-slate-50 p-2 rounded-2xl border border-slate-100 mt-0.5">
                    <Ionicons name="calendar-outline" size={16} color="#64748b" />
                  </View>
                  <View className="flex-1 ml-2">
                    <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Phạm vi các tuần được đăng ký</Text>
                    <Text className="text-xs font-bold text-slate-700 mt-0.5">
                      Tuần từ <Text className="text-blue-600 font-extrabold">{formatDateVi(allowedWeeksRange.start)}</Text> đến tuần <Text className="text-blue-600 font-extrabold">{formatDateVi(allowedWeeksRange.end)}</Text>
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
          {/* Calendar Month Selector & Grid container */}
          <View className="bg-white mx-4 mt-4 p-4 rounded-3xl border border-slate-200/80 shadow-xs">
            {/* Header navigator */}
            <View className="flex-row justify-between items-center mb-5 px-1">
              <Pressable onPress={handlePrevMonth} className="p-2 bg-slate-50 rounded-xl active:scale-95 border border-slate-100">
                <Ionicons name="chevron-back" size={16} color="#475569" />
              </Pressable>
              <Text className="text-base font-extrabold text-slate-800">
                Tháng {selectedMonth + 1} - {selectedYear}
              </Text>
              <Pressable
                onPress={handleNextMonth}
                disabled={!canGoNextMonth}
                className={`p-2 rounded-xl border border-slate-100 ${!canGoNextMonth ? "bg-slate-50 opacity-30" : "bg-slate-50 active:scale-95"}`}
              >
                <Ionicons name="chevron-forward" size={16} color={!canGoNextMonth ? "#cbd5e1" : "#475569"} />
              </Pressable>
            </View>

            {/* Weekday Labels Header */}
            <View className="flex-row mb-2">
              {dayNames.map((name) => (
                <View key={name} className="flex-1 items-center justify-center py-2 bg-slate-50/50 rounded-lg">
                  <Text className="text-[11px] font-black text-slate-400">{name}</Text>
                </View>
              ))}
            </View>

            {/* 42-day Grid */}
            <View className="flex-row flex-wrap">
              {calendarDays.map((date, idx) => {
                const dateStr = toLocalISOString(date);
                const isSelected = selectedDateStr === dateStr;

                const isCurrentMonth = date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;

                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const isPast = date < today;

                // Load active entry
                const entry = modifiedEntries[dateStr] || scheduleMap[dateStr]?.entry;
                const status = scheduleMap[dateStr]?.status || "none";

                // Cell styling logic
                let bgStyle = "bg-white";
                let borderStyle = "border border-slate-100";
                let textStyle = "text-slate-700 font-extrabold";

                if (entry) {
                  const typeOpt = typeOptions.find((opt) => opt.value === entry.type);
                  if (typeOpt) {
                    bgStyle = typeOpt.bg;
                    borderStyle = `border ${typeOpt.border}`;
                    textStyle = `${typeOpt.color} font-black`;
                  }
                }

                // Selected styling
                if (isSelected) {
                  borderStyle = "border-2 border-blue-600";
                }

                // Opacity fades
                let opacityStyle = "opacity-100";
                if (!isCurrentMonth) {
                  opacityStyle = "opacity-20";
                } else if (isPast) {
                  opacityStyle = "opacity-45";
                }

                return (
                  <Pressable
                    key={idx}
                    disabled={!isCurrentMonth}
                    onPress={() => setSelectedDateStr(dateStr)}
                    className="w-[14.28%] aspect-square p-1"
                  >
                    <View
                      className={`w-full h-full rounded-2xl items-center justify-center relative ${bgStyle} ${borderStyle} ${opacityStyle}`}
                    >
                      <Text className={`text-xs ${textStyle}`}>
                        {date.getDate()}
                      </Text>

                      {/* Small visual dot to represent note or status */}
                      {entry && entry.note && (
                        <View className="absolute bottom-1 w-1.5 h-1.5 bg-rose-500 rounded-full" />
                      )}

                      {/* Show draft badge dot */}
                      {status === "draft" && !entry?.note && (
                        <View className="absolute bottom-1 w-1.5 h-1.5 bg-amber-400 rounded-full" />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Month Stats breakdown */}
          <View className="mx-4 mt-3 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex-row justify-between flex-wrap gap-2">
            <View className="flex-1 min-w-[70px] bg-blue-50/50 p-2.5 rounded-2xl items-center border border-blue-100/50">
              <Text className="text-blue-500 font-black text-sm">{monthStats.office}</Text>
              <Text className="text-[10px] font-bold text-blue-700 mt-0.5">Cơ quan</Text>
            </View>
            <View className="flex-1 min-w-[70px] bg-purple-50/50 p-2.5 rounded-2xl items-center border border-purple-100/50">
              <Text className="text-purple-500 font-black text-sm">{monthStats.remote}</Text>
              <Text className="text-[10px] font-bold text-purple-700 mt-0.5">Từ xa</Text>
            </View>
            <View className="flex-1 min-w-[70px] bg-slate-50 p-2.5 rounded-2xl items-center border border-slate-200/50">
              <Text className="text-slate-500 font-black text-sm">{monthStats.day_off}</Text>
              <Text className="text-[10px] font-bold text-slate-600 mt-0.5">Nghỉ</Text>
            </View>
          </View>



          {/* Edit Panel for Selected Date */}
          <View className="mx-4 mt-3 mb-24 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
            <View className="flex-row items-center justify-between mb-4 pb-2 border-b border-slate-50">
              <View>
                <Text className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Cài đặt lịch</Text>
                <Text className="text-sm font-black text-slate-800">
                  {selectedDate.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "numeric" })}
                </Text>
              </View>

              {/* Status Badge */}
              <View className="flex-row items-center">
                {selectedDateWeekStatus === "approved" ? (
                  <View className="bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                    <Text className="text-[10px] font-extrabold text-emerald-600 uppercase">Đã duyệt</Text>
                  </View>
                ) : selectedDateWeekStatus === "pending" ? (
                  <View className="bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                    <Text className="text-[10px] font-extrabold text-amber-600 uppercase">Chờ duyệt</Text>
                  </View>
                ) : selectedDateWeekStatus === "draft" ? (
                  <View className="bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                    <Text className="text-[10px] font-extrabold text-slate-600 uppercase">Bản nháp</Text>
                  </View>
                ) : (
                  <View className="bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                    <Text className="text-[10px] font-extrabold text-gray-500 uppercase">Chưa tạo</Text>
                  </View>
                )}
              </View>
            </View>

            {readOnlyReason && (
              <View className="mb-4 p-3 bg-slate-50 border border-slate-100 rounded-2xl flex-row items-center space-x-2">
                <Ionicons name="lock-closed" size={14} color="#64748b" />
                <Text className="text-[11px] font-black text-slate-500 ml-1.5 flex-1">
                  Chỉ xem: {readOnlyReason}
                </Text>
              </View>
            )}

            <View style={{ gap: 16 }}>
              {/* Option Selector Cards */}
              <View className="flex-row flex-wrap gap-2.5">
                {typeOptions
                  .filter((opt) => opt.value === "office" || opt.value === "remote")
                  .map((opt) => {
                    const isSelected = selectedDateEntry.type === opt.value;
                    return (
                      <Pressable
                        key={opt.value}
                        disabled={isSelectedDateReadOnly}
                        onPress={() => {
                          const nextType = isSelected ? "day_off" : opt.value;
                          handleUpdateLocalEntry("type", nextType);
                        }}
                        className={`flex-1 min-w-[120px] p-3 rounded-2xl border flex-row items-center justify-between active:scale-95 ${isSelected
                          ? "bg-slate-900 border-slate-900 shadow-xs"
                          : "bg-slate-50 border-slate-200/60"
                          } ${isSelectedDateReadOnly ? "opacity-60" : ""}`}
                      >
                        <View className="flex-row items-center space-x-2">
                          <Ionicons
                            name={opt.icon as any}
                            size={16}
                            color={isSelected ? "#fff" : "#64748b"}
                          />
                          <Text
                            className={`text-xs font-black ml-1.5 ${isSelected ? "text-white" : "text-slate-600"
                              }`}
                          >
                            {opt.label}
                          </Text>
                        </View>
                        {isSelected && <Ionicons name="checkmark-circle" size={14} color="#fff" />}
                      </Pressable>
                    );
                  })}
              </View>

              {/* Note Field */}
              <View>
                <Text className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1.5">Ghi chú công việc</Text>
                <TextInput
                  value={selectedDateEntry.note}
                  editable={!isSelectedDateReadOnly}
                  onChangeText={(text) => handleUpdateLocalEntry("note", text)}
                  placeholder={isSelectedDateReadOnly ? "Không có ghi chú" : "Nhập ghi chú công việc (Ví dụ: Remote buổi sáng...)"}
                  className={`bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-3.5 text-xs text-slate-800 font-bold focus:border-slate-800 ${isSelectedDateReadOnly ? "opacity-60" : ""}`}
                />
              </View>

              {/* Register Draft Button */}
              {!isSelectedDateReadOnly && (
                <Pressable
                  onPress={handleSaveDraft}
                  disabled={saving}
                  className="bg-blue-600 active:scale-95 py-4 rounded-2xl flex-row items-center justify-center space-x-2 shadow-md shadow-blue-100 mt-2"
                >
                  <Ionicons name="save-outline" size={16} color="white" />
                  <Text className="text-white font-extrabold text-xs ml-1">
                    {saving ? "Đang xử lý..." : "Đăng ký lịch nháp"}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
