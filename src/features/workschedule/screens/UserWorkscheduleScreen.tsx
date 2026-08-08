import { useWorkscheduleUser } from "@/src/features/workschedule/hooks/useWorkscheduleUser";
import {
  getAllowedWeekRange,
  getWeekStartMonday,
  isRegistrationClosed,
  toLocalDateKey,
} from "@/src/features/workschedule/utils/date";
import { DayScheduleEditor } from "@/src/features/workschedule/ui/user/DayScheduleEditor";
import { WeekPicker } from "@/src/features/workschedule/ui/user/WeekPicker";
import type {
  EntryType,
  IScheduleEntry,
  IScheduleRequest,
  IWorkPolicy,
  WorkPeriod,
} from "@/src/services/workschedule/constant";
import { AppAlert as Alert } from "@/src/shared/ui/AppAlert";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

type DraftEntry = {
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
  draft: {
    label: "Bản nháp",
    box: "bg-blue-50",
    text: "text-blue-700",
    description: "Lịch đã được lưu nhưng chưa gửi cho quản lý duyệt.",
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
    description: "Lịch đã bị từ chối. Mở chi tiết để xem lý do.",
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

function RegistrationHeader({ onBack }: { onBack: () => void }) {
  return (
    <View className="flex-row items-center border-b border-slate-100 bg-white px-4 py-3">
      <Pressable
        className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-slate-100"
        onPress={onBack}
      >
        <Ionicons name="arrow-back" size={20} color="#334155" />
      </Pressable>
      <View>
        <Text className="text-lg font-black text-slate-900">Đăng ký lịch làm</Text>
        <Text className="text-[11px] text-slate-500">Chọn lịch và gửi quản lý duyệt</Text>
      </View>
    </View>
  );
}

export default function UserWorkscheduleScreen() {
  const {
    getMySchedules,
    createRequest,
    updateEntries,
    submitRequest,
    getPolicy,
  } = useWorkscheduleUser();
  const [schedules, setSchedules] = useState<IScheduleRequest[]>([]);
  const [policy, setPolicy] = useState<IWorkPolicy | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(1);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [draftEntries, setDraftEntries] = useState<Record<string, DraftEntry>>({});
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const scrollRef = useRef<ScrollView>(null);
  const closedAlertShownRef = useRef(false);

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
    router.replace("/(main)/user/utilities");
  }, []);

  useEffect(() => {
    if (initialLoad || !policy || !registrationClosed || closedAlertShownRef.current) return;
    closedAlertShownRef.current = true;
    Alert.alert(
      "Ngoài thời gian đăng ký",
      "Hiện tại không nằm trong thời gian đăng ký lịch làm.",
      [{ text: "Đồng ý", onPress: returnToUtilities }],
    );
  }, [initialLoad, policy, registrationClosed, returnToUtilities]);

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
        const stored = draftEntries[key] || backendEntryMap[key];
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
    [backendEntryMap, draftEntries, weekDays],
  );

  const unselectedDayIndexes = useMemo(
    () =>
      effectiveEntries
        .map((entry, index) => (entry.type ? -1 : index))
        .filter((index) => index >= 0),
    [effectiveEntries],
  );
  const selectedWorkDays = 7 - unselectedDayIndexes.length;
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
    if (requestStatus === "rejected") {
      return "Lịch bị từ chối. Hãy mở chi tiết để xem lý do.";
    }
    return null;
  }, [registrationClosed, requestStatus]);

  const selectedDayReadOnlyReason =
    weekReadOnlyReason ||
    (selectedDate < today ? "Ngày này đã trôi qua nên chỉ có thể xem." : null);
  const busy = saving || submitting;

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
    setDraftEntries((previous) => {
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
    setDraftEntries((previous) => ({
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
    setDraftEntries((previous) => {
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

  const persistSelectedWeek = async () => {
    if (!ensureHasWorkDay()) return null;
    const entries = buildEntries();
    if (selectedRequest?.status === "draft") {
      const updated = await updateEntries(selectedRequest._id, entries, false);
      return updated ? selectedRequest._id : null;
    }
    if (selectedRequest) return null;
    const created = await createRequest(
      toLocalDateKey(selectedWeekStart),
      entries,
      false,
    );
    return created?._id || null;
  };

  const clearSelectedWeekDraft = () => {
    const weekKeys = new Set(weekDays.map(toLocalDateKey));
    setDraftEntries((previous) => {
      const next = { ...previous };
      weekKeys.forEach((key) => delete next[key]);
      return next;
    });
  };

  const saveDraft = async () => {
    if (weekReadOnlyReason) {
      Alert.alert("Không thể chỉnh sửa", weekReadOnlyReason);
      return;
    }
    setSaving(true);
    const requestId = await persistSelectedWeek();
    if (requestId) {
      clearSelectedWeekDraft();
      await loadData();
      Alert.alert("Thành công", "Đã lưu bản nháp. Bạn có thể quay lại sửa sau.");
    }
    setSaving(false);
  };

  const submitForApproval = () => {
    if (weekReadOnlyReason) {
      Alert.alert("Không thể gửi lịch", weekReadOnlyReason);
      return;
    }
    if (!ensureHasWorkDay()) return;

    Alert.alert(
      "Gửi lịch để duyệt?",
      `Bạn đang đăng ký ${selectedWorkDays} ngày làm. Sau khi gửi, lịch sẽ chờ quản lý phản hồi.`,
      [
        { text: "Kiểm tra lại", style: "cancel" },
        {
          text: "Gửi duyệt",
          onPress: async () => {
            setSubmitting(true);
            const requestId = await persistSelectedWeek();
            if (requestId) {
              const submitted = await submitRequest(requestId);
              if (submitted) {
                clearSelectedWeekDraft();
                await loadData();
              }
            }
            setSubmitting(false);
          },
        },
      ],
    );
  };

  const goToNextDay = () => {
    const nextUnselected = unselectedDayIndexes.find((index) => index > selectedDayIndex);
    setSelectedDayIndex(nextUnselected ?? Math.min(selectedDayIndex + 1, 6));
  };

  if (initialLoad) {
    return (
      <View className="flex-1 bg-slate-50">
        <RegistrationHeader onBack={returnToUtilities} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#dc2626" />
          <Text className="mt-3 text-sm font-semibold text-slate-400">
            Đang tải lịch làm việc...
          </Text>
        </View>
      </View>
    );
  }

  if (policy && registrationClosed) {
    return (
      <View className="flex-1 bg-slate-50">
        <RegistrationHeader onBack={returnToUtilities} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <RegistrationHeader onBack={returnToUtilities} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
      >
        {policy ? (
          <View className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3">
            <View className="flex-row items-center justify-center">
              <Ionicons name="time-outline" size={17} color="#dc2626" />
              <Text className="ml-2 text-sm font-black text-red-600">
                Thời gian còn lại: {padCountdownValue(countdown.days)} :{" "}
                {padCountdownValue(countdown.hours)} :{" "}
                {padCountdownValue(countdown.minutes)} :{" "}
                {padCountdownValue(countdown.seconds)}
              </Text>
            </View>
            <Text className="mt-1 text-center text-[9px] font-semibold uppercase tracking-wider text-red-400">
              Ngày · Giờ · Phút · Giây
            </Text>
          </View>
        ) : null}

        <View className="mb-4 flex-row items-center rounded-2xl border border-blue-100 bg-blue-50 p-3">
          {["Chọn tuần", "Chọn ngày làm"].map((label, index) => (
            <React.Fragment key={label}>
              <View className="flex-1 items-center">
                <View className="h-6 w-6 items-center justify-center rounded-full bg-blue-600">
                  <Text className="text-[10px] font-black text-white">{index + 1}</Text>
                </View>
                <Text className="mt-1 text-center text-[9px] font-bold text-blue-800">
                  {label}
                </Text>
              </View>
              {index < 1 ? <View className="mb-4 h-px w-5 bg-blue-200" /> : null}
            </React.Fragment>
          ))}
        </View>

        <WeekPicker
          weekStart={selectedWeekStart}
          index={selectedWeekIndex}
          total={allowedWeeks.length}
          statusLabel={status.label}
          statusBoxClassName={status.box}
          statusTextClassName={status.text}
          onPrevious={() => changeSelectedWeek(selectedWeekIndex - 1)}
          onNext={() => changeSelectedWeek(selectedWeekIndex + 1)}
        />

        <View className="mt-4 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <View className="flex-row items-center">
            <View className="h-8 w-8 items-center justify-center rounded-xl bg-red-50">
              <Text className="text-sm font-black text-red-600">2</Text>
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-base font-black text-slate-900">
                Chọn những ngày đi làm
              </Text>
              <Text className="mt-0.5 text-xs text-slate-500">
                Ngày không chọn sẽ được hiểu là ngày nghỉ
              </Text>
            </View>
          </View>

          {!weekReadOnlyReason ? (
            <View className="mt-4 rounded-2xl bg-slate-50 p-3">
              <Text className="mb-2 text-[11px] font-black uppercase tracking-wider text-slate-500">
                Thiết lập nhanh T2 - T6
              </Text>
              <Pressable
                accessibilityHint="Chọn làm cả ngày tại công ty từ Thứ Hai đến Thứ Sáu"
                accessibilityLabel="Chọn full tuần"
                className="mb-2 flex-row items-center rounded-xl bg-blue-600 px-3 py-3 active:bg-blue-700"
                onPress={() => applyPreset("office", "full_day")}
              >
                <View className="h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                  <Ionicons name="calendar" size={17} color="#ffffff" />
                </View>
                <View className="ml-2.5 flex-1">
                  <Text className="text-xs font-black text-white">
                    Chọn full tuần
                  </Text>
                  <Text className="mt-0.5 text-[10px] font-semibold text-blue-100">
                    T2 - T6 · Cả ngày · Tại công ty
                  </Text>
                </View>
                <Ionicons name="checkmark-circle-outline" size={20} color="#ffffff" />
              </Pressable>
              <View className="flex-row">
                <Pressable
                  className="mr-2 flex-1 flex-row items-center justify-center rounded-xl border border-blue-100 bg-white py-2.5"
                  onPress={() => applyPreset("office")}
                >
                  <Ionicons name="business-outline" size={15} color="#2563eb" />
                  <Text className="ml-1.5 text-xs font-black text-blue-700">
                    Tại công ty
                  </Text>
                </Pressable>
                <Pressable
                  className="flex-1 flex-row items-center justify-center rounded-xl border border-purple-100 bg-white py-2.5"
                  onPress={() => applyPreset("remote")}
                >
                  <Ionicons name="home-outline" size={15} color="#9333ea" />
                  <Text className="ml-1.5 text-xs font-black text-purple-700">
                    Làm từ xa
                  </Text>
                </Pressable>
              </View>
              <Text className="mt-2 text-[10px] leading-4 text-slate-400">
                T7 và Chủ nhật để trống mặc định. Nếu làm thêm, hãy chọn trực tiếp ngày đó.
              </Text>
            </View>
          ) : (
            <View className="mt-4 rounded-2xl bg-slate-50 p-3">
              <Text className="text-xs font-semibold leading-5 text-slate-600">
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
                      : "border-slate-200 bg-white"
                  }`}
                  key={toLocalDateKey(date)}
                  onPress={() => setSelectedDayIndex(index)}
                >
                  <Text
                    className={`text-[10px] font-black ${
                      selected ? "text-white/80" : "text-slate-400"
                    }`}
                  >
                    {DAY_NAMES[index]}
                  </Text>
                  <Text
                    className={`mt-1 text-sm font-black ${
                      selected ? "text-white" : "text-slate-800"
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

          <DayScheduleEditor
            date={selectedDate}
            entry={selectedEntry}
            readOnly={Boolean(selectedDayReadOnlyReason)}
            readOnlyReason={selectedDayReadOnlyReason}
            hasNext={selectedDayIndex < 6}
            onChange={handleEntryChange}
            onClear={clearSelectedDay}
            onNext={goToNextDay}
          />

          {!weekReadOnlyReason ? (
            <View className="mt-5 gap-3 border-t border-slate-100 pt-4">
              <Pressable
                className="items-center justify-center rounded-2xl border border-slate-200 bg-white py-4 active:bg-slate-50"
                disabled={busy}
                onPress={saveDraft}
              >
                <Text className="text-sm font-black text-slate-700">
                  {saving ? "Đang lưu..." : "Lưu bản nháp"}
                </Text>
              </Pressable>
              <Pressable
                className={`flex-row items-center justify-center rounded-2xl py-4 ${
                  selectedWorkDays > 0 ? "bg-red-600" : "bg-red-300"
                }`}
                disabled={busy}
                onPress={submitForApproval}
              >
                <Text className="mr-1.5 text-sm font-black text-white">
                  {submitting ? "Đang gửi..." : "Gửi lịch để duyệt"}
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
