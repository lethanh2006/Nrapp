import { usePersonalWorkschedule } from "@/src/features/workschedule/shared/hooks/usePersonalWorkschedule";
import { APP_ROUTES } from "@/src/application/navigation/routes";
import {
  getAllowedWeekRange,
  getWeekStartMonday,
  isRegistrationClosed,
  toLocalDateKey,
} from "@/src/features/workschedule/shared/utils/date";
import { AdminDayScheduleEditor } from "@/src/features/workschedule/admin/ui/AdminDayScheduleEditor";
import { AdminWeekPicker } from "@/src/features/workschedule/admin/ui/AdminWeekPicker";
import type {
  EntryType,
  IScheduleEntry,
  IScheduleRequest,
  IWorkPolicy,
  WorkPeriod,
} from "@/src/services/workschedule/constant";
import { AppAlert as Alert } from "@/src/shared/ui/AppAlert";
import { ScreenHeader } from "@/src/shared/ui/ScreenHeader";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

type EditableEntry = {
  type: EntryType | undefined;
  period: WorkPeriod;
  note: string;
};

const DAY_NAMES = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const STATUS_CONFIG: Record<
  string,
  { label: string; box: string; text: string; description: string }
> = {
  none: {
    label: "Chưa đăng ký",
    box: "bg-slate-100",
    text: "text-slate-600",
    description: "Tuần này chưa có lịch. Chỉ chọn những ngày bạn có thể đi làm.",
  },
  pending: {
    label: "Chờ duyệt",
    box: "bg-amber-50",
    text: "text-amber-700",
    description: "Lịch đã được gửi và đang chờ quản lý duyệt.",
  },
  approved: {
    label: "Đã duyệt",
    box: "bg-emerald-50",
    text: "text-emerald-700",
    description: "Lịch tuần này đã được quản lý phê duyệt.",
  },
  rejected: {
    label: "Cần xem lại",
    box: "bg-rose-50",
    text: "text-rose-700",
    description: "Lịch đã bị từ chối. Xem lý do và chỉnh sửa khi cổng đăng ký mở.",
  },
};

const TYPE_META: Record<EntryType, { dot: string }> = {
  office: { dot: "bg-blue-500" },
  remote: { dot: "bg-purple-500" },
  day_off: { dot: "bg-slate-400" },
  leave: { dot: "bg-orange-500" },
};

const isSameWeek = (date: string | Date, weekStart: Date) =>
  toLocalDateKey(getWeekStartMonday(new Date(date))) === toLocalDateKey(weekStart);

const padCountdownValue = (value: number) => String(value).padStart(2, "0");

export default function AdminPersonalWorkscheduleScreen() {
  const {
    getMySchedules,
    sendScheduleRequest,
    resubmitRejectedSchedule,
    getPolicy,
  } = usePersonalWorkschedule();
  const [schedules, setSchedules] = useState<IScheduleRequest[]>([]);
  const [policy, setPolicy] = useState<IWorkPolicy | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(1);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [editedEntries, setEditedEntries] = useState<Record<string, EditableEntry>>({});
  const [submitting, setSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const scrollRef = useRef<ScrollView>(null);

  const allowedWeeksRange = useMemo(() => getAllowedWeekRange(), []);
  const allowedWeeks = useMemo(() => {
    const result: Date[] = [];
    const cursor = new Date(allowedWeeksRange.start);
    while (cursor <= allowedWeeksRange.end) {
      result.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 7);
    }
    return result;
  }, [allowedWeeksRange]);

  const selectedWeekStart =
    allowedWeeks[Math.min(selectedWeekIndex, allowedWeeks.length - 1)] ||
    allowedWeeksRange.start;

  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = new Date(selectedWeekStart);
        date.setDate(date.getDate() + index);
        return date;
      }),
    [selectedWeekStart],
  );

  const loadData = useCallback(async () => {
    const [scheduleData, policyData] = await Promise.all([
      getMySchedules(),
      getPolicy(),
    ]);
    setSchedules(scheduleData);
    setPolicy(policyData);
    setInitialLoad(false);
  }, [getMySchedules, getPolicy]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const selectedRequest = useMemo(
    () =>
      schedules.find((schedule) =>
        isSameWeek(schedule.week_start, selectedWeekStart),
      ) || null,
    [schedules, selectedWeekStart],
  );

  const requestStatus = selectedRequest?.status || "none";
  const status = STATUS_CONFIG[requestStatus] || STATUS_CONFIG.none;
  const registrationClosed = useMemo(
    () => isRegistrationClosed(policy, new Date(currentTime)),
    [currentTime, policy],
  );

  useEffect(() => {
    if (!policy) return;
    setCurrentTime(Date.now());
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [policy]);

  const returnToUtilities = useCallback(() => {
    router.replace(APP_ROUTES.admin.utilities);
  }, []);

  const countdown = useMemo(() => {
    const endTime = policy ? new Date(policy.registration_end).getTime() : currentTime;
    const totalSeconds = Math.max(0, Math.floor((endTime - currentTime) / 1000));
    return {
      days: Math.floor(totalSeconds / 86400),
      hours: Math.floor((totalSeconds % 86400) / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60,
    };
  }, [currentTime, policy]);

  const today = useMemo(() => {
    const value = new Date();
    value.setHours(0, 0, 0, 0);
    return value;
  }, []);

  const backendEntryMap = useMemo(() => {
    const result: Record<string, IScheduleEntry> = {};
    (selectedRequest?.entries || []).forEach((entry) => {
      result[toLocalDateKey(new Date(entry.date))] = entry;
    });
    return result;
  }, [selectedRequest]);

  const effectiveEntries = useMemo(
    () =>
      weekDays.map((date) => {
        const key = toLocalDateKey(date);
        const stored = editedEntries[key] || backendEntryMap[key];
        if (stored) {
          const registeredType =
            stored.type === "office" || stored.type === "remote"
              ? stored.type
              : undefined;
          return {
            date: key,
            type: registeredType,
            period: stored.period || "full_day",
            note: registeredType ? stored.note || "" : "",
          };
        }
        return {
          date: key,
          type: undefined,
          period: "full_day" as const,
          note: "",
        };
      }),
    [backendEntryMap, editedEntries, weekDays],
  );

  const selectedWorkDays = effectiveEntries.filter((entry) => entry.type).length;
  const selectedDate = weekDays[selectedDayIndex] || weekDays[0];
  const selectedEntry = effectiveEntries[selectedDayIndex] || effectiveEntries[0];

  const weekReadOnlyReason = useMemo(() => {
    if (registrationClosed) return "Đã hết thời gian đăng ký lịch làm.";
    if (requestStatus === "pending") {
      return "Lịch đã gửi duyệt nên không thể chỉnh sửa.";
    }
    if (requestStatus === "approved") {
      return "Lịch đã được duyệt nên không thể chỉnh sửa.";
    }
    return null;
  }, [registrationClosed, requestStatus]);

  const selectedDayReadOnlyReason =
    weekReadOnlyReason ||
    (selectedDate < today ? "Ngày này đã trôi qua nên chỉ có thể xem." : null);
  const changeSelectedWeek = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= allowedWeeks.length) return;
    setSelectedWeekIndex(nextIndex);
    setSelectedDayIndex(0);
  };

  const handleEntryChange = (
    field: "type" | "period" | "note",
    value: string,
  ) => {
    if (selectedDayReadOnlyReason) return;
    const dateKey = toLocalDateKey(selectedDate);
    setEditedEntries((previous) => {
      const current = previous[dateKey] || selectedEntry;
      return {
        ...previous,
        [dateKey]: {
          type: field === "type" ? (value as EntryType) : current.type,
          period:
            field === "period"
              ? (value as WorkPeriod)
              : current.period || "full_day",
          note: field === "note" ? value : current.note || "",
        },
      };
    });
  };

  const clearSelectedDay = () => {
    if (selectedDayReadOnlyReason) return;
    const dateKey = toLocalDateKey(selectedDate);
    setEditedEntries((previous) => ({
      ...previous,
      [dateKey]: {
        type: undefined,
        period: "full_day",
        note: "",
      },
    }));
  };

  const applyPreset = (
    weekdayType: "office" | "remote",
    period?: WorkPeriod,
  ) => {
    if (weekReadOnlyReason) return;
    setEditedEntries((previous) => {
      const next = { ...previous };
      weekDays.forEach((date, index) => {
        if (date < today || index >= 5) return;
        const key = toLocalDateKey(date);
        const current = previous[key] || backendEntryMap[key];
        next[key] = {
          type: weekdayType,
          period: period || current?.period || "full_day",
          note: current?.note || "",
        };
      });
      return next;
    });
  };

  const ensureHasWorkDay = () => {
    if (selectedWorkDays > 0) return true;
    Alert.alert(
      "Chưa chọn ngày làm",
      "Hãy chọn ít nhất một ngày bạn có thể đi làm trong tuần này.",
    );
    return false;
  };

  const buildEntries = (): IScheduleEntry[] =>
    effectiveEntries
      .filter(
        (entry): entry is typeof entry & { type: "office" | "remote" } =>
          entry.type === "office" || entry.type === "remote",
      )
      .map((entry) => ({
        date: entry.date,
        type: entry.type,
        period: entry.period || "full_day",
        note: entry.note || "",
      }));

  const clearSelectedWeekChanges = () => {
    const weekKeys = new Set(weekDays.map(toLocalDateKey));
    setEditedEntries((previous) => {
      const next = { ...previous };
      weekKeys.forEach((key) => delete next[key]);
      return next;
    });
  };

  const submitForApproval = () => {
    if (weekReadOnlyReason) {
      Alert.alert("Không thể gửi lịch", weekReadOnlyReason);
      return;
    }
    if (!ensureHasWorkDay()) return;

    const isResubmission = requestStatus === "rejected" && selectedRequest;
    Alert.alert(
      isResubmission ? "Gửi lại lịch để duyệt?" : "Gửi lịch để duyệt?",
      `Bạn đang đăng ký ${selectedWorkDays} ngày làm. ${
        isResubmission
          ? "Lịch cũ sẽ được thay bằng nội dung đã chỉnh sửa và chuyển lại về chờ duyệt."
          : "Sau khi gửi, lịch sẽ chờ quản lý phản hồi."
      }`,
      [
        { text: "Kiểm tra lại", style: "cancel" },
        {
          text: isResubmission ? "Gửi lại" : "Gửi duyệt",
          onPress: async () => {
            try {
              setSubmitting(true);
              const entries = buildEntries();
              const submitted = isResubmission
                ? await resubmitRejectedSchedule(selectedRequest._id, entries)
                : await sendScheduleRequest(
                    toLocalDateKey(selectedWeekStart),
                    entries,
                  );
              if (submitted) {
                clearSelectedWeekChanges();
                await loadData();
              }
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    );
  };

  if (initialLoad) {
    return (
      <View className="flex-1 bg-slate-950">
        <ScreenHeader
          onBack={returnToUtilities}
          subtitle="Lịch cá nhân trong khu quản trị"
          title="Lịch làm của tôi"
        />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#dc2626" />
          <Text className="mt-3 text-sm font-semibold text-slate-500">
            Đang tải lịch làm việc...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-950">
      <ScreenHeader
        onBack={returnToUtilities}
        subtitle="Lịch cá nhân trong khu quản trị"
        title="Lịch làm của tôi"
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-4 overflow-hidden rounded-3xl border border-red-900/60 bg-slate-900 p-5">
          <View className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-red-600/10" />
          <View className="flex-row items-center">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15">
              <Ionicons name="shield-checkmark-outline" size={24} color="#f87171" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-[10px] font-black uppercase tracking-[2px] text-red-400">
                Chế độ quản trị
              </Text>
              <Text className="mt-1 text-lg font-black text-white">
                Lịch cá nhân của quản lý
              </Text>
            </View>
          </View>
          <Text className="mt-4 text-xs leading-5 text-slate-400">
            Lịch này chỉ áp dụng cho tài khoản hiện tại và được tách khỏi khu vực duyệt lịch nhân viên.
          </Text>
        </View>

        {policy ? (
          registrationClosed ? (
            <View className="mb-4 flex-row items-start rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
              <Ionicons name="lock-closed-outline" size={18} color="#d97706" />
              <View className="ml-2 flex-1">
                <Text className="text-sm font-black text-amber-800">
                  Ngoài thời gian đăng ký
                </Text>
                <Text className="mt-1 text-xs leading-5 text-amber-700">
                  Bạn vẫn có thể xem lịch và lý do từ chối, nhưng chỉ chỉnh sửa hoặc gửi lại khi cổng đăng ký mở.
                </Text>
              </View>
            </View>
          ) : (
            <View className="mb-4 rounded-2xl border border-red-900/60 bg-red-950/40 px-4 py-3">
              <View className="flex-row items-center justify-center">
                <Ionicons name="time-outline" size={17} color="#dc2626" />
                <Text className="ml-2 text-sm font-black text-red-300">
                  Thời gian còn lại: {padCountdownValue(countdown.days)} :{" "}
                  {padCountdownValue(countdown.hours)} :{" "}
                  {padCountdownValue(countdown.minutes)} :{" "}
                  {padCountdownValue(countdown.seconds)}
                </Text>
              </View>
            </View>
          )
        ) : null}

        <AdminWeekPicker
          weekStart={selectedWeekStart}
          index={selectedWeekIndex}
          total={allowedWeeks.length}
          statusLabel={status.label}
          statusBoxClassName={status.box}
          statusTextClassName={status.text}
          onPrevious={() => changeSelectedWeek(selectedWeekIndex - 1)}
          onNext={() => changeSelectedWeek(selectedWeekIndex + 1)}
        />

        {requestStatus === "rejected" ? (
          <View className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <View className="flex-row items-start">
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-rose-100">
                <Ionicons name="chatbox-ellipses-outline" size={18} color="#be123c" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-xs font-black uppercase tracking-wide text-rose-700">
                  Lý do quản lý từ chối
                </Text>
                <Text className="mt-1.5 text-sm font-semibold leading-6 text-rose-950">
                  {selectedRequest?.reject_reason?.trim() ||
                    "Quản lý chưa cung cấp lý do cụ thể."}
                </Text>
                <Text className="mt-2 text-xs leading-5 text-rose-700">
                  {registrationClosed
                    ? "Hãy quay lại chỉnh sửa khi cổng đăng ký mở."
                    : "Bạn có thể chỉnh trực tiếp các ngày bên dưới rồi bấm Gửi lại lịch."}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        <View className="mt-4 rounded-3xl border border-slate-800 bg-slate-900 p-4">
          <View className="flex-row items-center">
            <View className="h-8 w-8 items-center justify-center rounded-xl bg-red-500/15">
              <Ionicons name="calendar-outline" size={17} color="#f87171" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-base font-black text-white">
                Cấu hình ngày làm việc
              </Text>
              <Text className="mt-0.5 text-xs text-slate-400">
                Thiết lập nhanh hoặc chỉnh từng ngày bên dưới
              </Text>
            </View>
          </View>

          {!weekReadOnlyReason ? (
            <View className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-3">
              <Text className="mb-2 text-[11px] font-black uppercase tracking-wider text-slate-400">
                Thiết lập nhanh T2 - T6
              </Text>
              <Pressable
                accessibilityHint="Chọn làm cả ngày tại công ty từ Thứ Hai đến Thứ Sáu"
                accessibilityLabel="Chọn full tuần"
                className="mb-2 flex-row items-center rounded-xl bg-red-600 px-3 py-3 active:bg-red-700"
                onPress={() => applyPreset("office", "full_day")}
              >
                <View className="h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                  <Ionicons name="calendar" size={17} color="#ffffff" />
                </View>
                <View className="ml-2.5 flex-1">
                  <Text className="text-xs font-black text-white">
                    Chọn full tuần
                  </Text>
                  <Text className="mt-0.5 text-[10px] font-semibold text-red-100">
                    T2 - T6 · Cả ngày · Tại công ty
                  </Text>
                </View>
                <Ionicons name="checkmark-circle-outline" size={20} color="#ffffff" />
              </Pressable>
              <View className="flex-row">
                <Pressable
                  className="mr-2 flex-1 flex-row items-center justify-center rounded-xl border border-slate-700 bg-slate-900 py-2.5"
                  onPress={() => applyPreset("office")}
                >
                  <Ionicons name="business-outline" size={15} color="#2563eb" />
                  <Text className="ml-1.5 text-xs font-black text-blue-300">
                    Tại công ty
                  </Text>
                </Pressable>
                <Pressable
                  className="flex-1 flex-row items-center justify-center rounded-xl border border-slate-700 bg-slate-900 py-2.5"
                  onPress={() => applyPreset("remote")}
                >
                  <Ionicons name="home-outline" size={15} color="#9333ea" />
                  <Text className="ml-1.5 text-xs font-black text-purple-300">
                    Làm từ xa
                  </Text>
                </Pressable>
              </View>
              <Text className="mt-2 text-[10px] leading-4 text-slate-500">
                T7 và Chủ nhật để trống mặc định. Nếu làm thêm, hãy chọn trực tiếp ngày đó.
              </Text>
            </View>
          ) : (
            <View className="mt-4 rounded-2xl bg-slate-800 p-3">
              <Text className="text-xs font-semibold leading-5 text-slate-300">
                {status.description}
              </Text>
            </View>
          )}

          <View className="mt-4 flex-row justify-between">
            {weekDays.map((date, index) => {
              const entry = effectiveEntries[index];
              const selected = selectedDayIndex === index;
              const typeMeta = entry.type ? TYPE_META[entry.type] : null;
              return (
                <Pressable
                  className={`w-[13%] items-center rounded-2xl border py-2.5 ${
                    selected
                      ? "border-red-600 bg-red-600"
                      : "border-slate-700 bg-slate-950"
                  }`}
                  key={toLocalDateKey(date)}
                  onPress={() => setSelectedDayIndex(index)}
                >
                  <Text
                    className={`text-[10px] font-black ${
                      selected ? "text-white/80" : "text-slate-500"
                    }`}
                  >
                    {DAY_NAMES[index]}
                  </Text>
                  <Text
                    className={`mt-1 text-sm font-black ${
                      selected ? "text-white" : "text-slate-200"
                    }`}
                  >
                    {date.getDate()}
                  </Text>
                  <View
                    className={`mt-1.5 h-1.5 w-1.5 rounded-full ${
                      selected
                        ? "bg-white"
                        : typeMeta?.dot || "bg-slate-300"
                    }`}
                  />
                </Pressable>
              );
            })}
          </View>

          <AdminDayScheduleEditor
            date={selectedDate}
            entry={selectedEntry}
            readOnly={Boolean(selectedDayReadOnlyReason)}
            readOnlyReason={selectedDayReadOnlyReason}
            onChange={handleEntryChange}
            onClear={clearSelectedDay}
          />

          {!weekReadOnlyReason ? (
            <View className="mt-5 border-t border-slate-800 pt-4">
              <Pressable
                className={`flex-row items-center justify-center rounded-2xl py-4 ${
                  selectedWorkDays > 0 ? "bg-red-600" : "bg-red-300"
                }`}
                disabled={submitting}
                onPress={submitForApproval}
              >
                <Text className="mr-1.5 text-sm font-black text-white">
                  {submitting
                    ? "Đang gửi..."
                    : requestStatus === "rejected"
                      ? "Gửi lại lịch"
                      : "Gửi lịch để duyệt"}
                </Text>
                <Ionicons name="paper-plane" size={16} color="white" />
              </Pressable>
            </View>
          ) : null}
        </View>

      </ScrollView>
    </View>
  );
}
