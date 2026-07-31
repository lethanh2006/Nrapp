import ScheduleList from "@/src/features/workschedule/ui/user/ScheduleList";
import { ScheduleCalendar } from "@/src/features/workschedule/ui/user/ScheduleCalendar";
import { ScheduleEntryEditor } from "@/src/features/workschedule/ui/user/ScheduleEntryEditor";
import { RegistrationPolicyCard } from "@/src/features/workschedule/ui/user/RegistrationPolicyCard";
import { useWorkscheduleUser } from "@/src/features/workschedule/api/useUserWorkscheduleApi";
import { IScheduleRequest, IScheduleEntry, EntryType, IWorkPolicy } from "@/src/features/workschedule/model/workschedule.types";
import {
  getAllowedWeekRange,
  getWeekStartMonday,
  isRegistrationClosed,
  toLocalDateKey,
} from "@/src/features/workschedule/utils/date";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function UserWorkscheduleScreen() {
  const { getMySchedules, createRequest, updateEntries, getPolicy, loading } = useWorkscheduleUser();
  const [schedules, setSchedules] = useState<IScheduleRequest[]>([]);
  const [policy, setPolicy] = useState<IWorkPolicy | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);

  const isOutsideRegistrationWindow = useMemo(
    () => isRegistrationClosed(policy),
    [policy],
  );

  const allowedWeeksRange = useMemo(() => getAllowedWeekRange(), []);

  // View Mode: "calendar" or "list"
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");

  // Selected Month & Year
  const [currentDate, setCurrentDate] = useState(new Date());
  const selectedMonth = currentDate.getMonth();
  const selectedYear = currentDate.getFullYear();

  // Selected Date on Calendar
  const [selectedDateStr, setSelectedDateStr] = useState<string>(toLocalDateKey(new Date()));

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
        const dStr = toLocalDateKey(new Date(e.date));
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
    const firstDayStr = toLocalDateKey(new Date(selectedYear, selectedMonth - 1, 1));
    setSelectedDateStr(firstDayStr);
  };

  const handleNextMonth = () => {
    if (!canGoNextMonth) return;
    setCurrentDate(new Date(selectedYear, selectedMonth + 1, 1));
    const firstDayStr = toLocalDateKey(new Date(selectedYear, selectedMonth + 1, 1));
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
      const dStr = toLocalDateKey(d);

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
        const mondayStr = toLocalDateKey(monday);
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
          const tempStr = toLocalDateKey(temp);

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
          return toLocalDateKey(reqMon) === mondayStr;
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
            <RegistrationPolicyCard
              policy={policy}
              closed={isOutsideRegistrationWindow}
              allowedWeeks={allowedWeeksRange}
              className="mb-4"
            />
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
            <RegistrationPolicyCard
              policy={policy}
              closed={isOutsideRegistrationWindow}
              allowedWeeks={allowedWeeksRange}
              className="mx-4 mt-4"
            />
          )}
          <ScheduleCalendar
            month={selectedMonth}
            year={selectedYear}
            days={calendarDays}
            selectedDateKey={selectedDateStr}
            scheduleMap={scheduleMap}
            modifiedEntries={modifiedEntries}
            canGoNext={canGoNextMonth}
            onSelectDate={setSelectedDateStr}
            onPreviousMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
          />

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



          <ScheduleEntryEditor
            date={selectedDate}
            entry={selectedDateEntry}
            weekStatus={selectedDateWeekStatus}
            readOnly={isSelectedDateReadOnly}
            readOnlyReason={readOnlyReason}
            saving={saving}
            onChange={handleUpdateLocalEntry}
            onSave={handleSaveDraft}
          />
        </ScrollView>
      )}
    </View>
  );
}
