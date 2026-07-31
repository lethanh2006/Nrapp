import { toLocalDateKey } from "@/src/features/workschedule/utils/date";
import {
  SCHEDULE_TYPE_OPTIONS,
  WEEKDAY_NAMES,
} from "@/src/services/workschedule/constant";
import type {
  EntryType,
  IScheduleEntry,
} from "@/src/services/workschedule/constant";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

type ScheduleMap = Record<
  string,
  { entry: IScheduleEntry; status: string; requestId: string }
>;

type ModifiedEntries = Record<
  string,
  { type: EntryType | undefined; note: string }
>;

type ScheduleCalendarProps = {
  month: number;
  year: number;
  days: Date[];
  selectedDateKey: string;
  scheduleMap: ScheduleMap;
  modifiedEntries: ModifiedEntries;
  canGoNext: boolean;
  onSelectDate: (dateKey: string) => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
};

export function ScheduleCalendar({
  month,
  year,
  days,
  selectedDateKey,
  scheduleMap,
  modifiedEntries,
  canGoNext,
  onSelectDate,
  onPreviousMonth,
  onNextMonth,
}: ScheduleCalendarProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <View className="mx-4 mt-4 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs">
      <View className="mb-5 flex-row items-center justify-between px-1">
        <Pressable
          onPress={onPreviousMonth}
          className="rounded-xl border border-slate-100 bg-slate-50 p-2"
        >
          <Ionicons name="chevron-back" size={16} color="#475569" />
        </Pressable>
        <Text className="text-base font-extrabold text-slate-800">
          Tháng {month + 1} - {year}
        </Text>
        <Pressable
          onPress={onNextMonth}
          disabled={!canGoNext}
          className={`rounded-xl border border-slate-100 p-2 ${
            canGoNext ? "bg-slate-50" : "bg-slate-50 opacity-30"
          }`}
        >
          <Ionicons
            name="chevron-forward"
            size={16}
            color={canGoNext ? "#475569" : "#cbd5e1"}
          />
        </Pressable>
      </View>

      <View className="mb-2 flex-row">
        {WEEKDAY_NAMES.map((name) => (
          <View
            key={name}
            className="flex-1 items-center justify-center rounded-lg bg-slate-50/50 py-2"
          >
            <Text className="text-[11px] font-black text-slate-400">
              {name}
            </Text>
          </View>
        ))}
      </View>

      <View className="flex-row flex-wrap">
        {days.map((date) => {
          const dateKey = toLocalDateKey(date);
          const selected = selectedDateKey === dateKey;
          const currentMonth =
            date.getMonth() === month && date.getFullYear() === year;
          const entry =
            modifiedEntries[dateKey] || scheduleMap[dateKey]?.entry;
          const status = scheduleMap[dateKey]?.status || "none";
          const typeOption = SCHEDULE_TYPE_OPTIONS.find(
            (option) => option.value === entry?.type,
          );

          const background = typeOption?.backgroundClassName || "bg-white";
          const border = selected
            ? "border-2 border-blue-600"
            : `border ${typeOption?.borderClassName || "border-slate-100"}`;
          const text =
            typeOption?.textClassName || "text-slate-700 font-extrabold";
          const opacity = !currentMonth
            ? "opacity-20"
            : date < today
              ? "opacity-45"
              : "opacity-100";

          return (
            <Pressable
              key={dateKey}
              disabled={!currentMonth}
              onPress={() => onSelectDate(dateKey)}
              className="aspect-square w-[14.28%] p-1"
            >
              <View
                className={`relative h-full w-full items-center justify-center rounded-2xl ${background} ${border} ${opacity}`}
              >
                <Text className={`text-xs font-black ${text}`}>
                  {date.getDate()}
                </Text>
                {entry?.note ? (
                  <View className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-rose-500" />
                ) : status === "draft" ? (
                  <View className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-amber-400" />
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
