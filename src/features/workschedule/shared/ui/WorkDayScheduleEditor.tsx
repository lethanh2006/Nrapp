import type {
  EntryType,
  IScheduleEntry,
  WorkPeriod,
} from "@/src/services/workschedule/constant";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

type IconName = ComponentProps<typeof Ionicons>["name"];

type WorkDayScheduleEditorProps = {
  date: Date;
  entry: Partial<IScheduleEntry>;
  readOnly: boolean;
  readOnlyReason?: string | null;
  onChange: (field: "type" | "period" | "note", value: string) => void;
  onClear: () => void;
  tone?: "default" | "admin";
  saved?: boolean;
};

const WORK_OPTIONS: {
  value: EntryType;
  label: string;
  description: string;
  icon: IconName;
  color: string;
  selectedBox: string;
}[] = [
  {
    value: "office",
    label: "Tại công ty",
    description: "Làm việc trực tiếp",
    icon: "business",
    color: "#2563eb",
    selectedBox: "border-blue-500 bg-blue-50",
  },
  {
    value: "remote",
    label: "Làm từ xa",
    description: "Làm việc online",
    icon: "home",
    color: "#9333ea",
    selectedBox: "border-purple-500 bg-purple-50",
  },
];

const PERIOD_OPTIONS: { value: WorkPeriod; label: string; hint: string }[] = [
  { value: "full_day", label: "Cả ngày", hint: "2 buổi" },
  { value: "morning", label: "Buổi sáng", hint: "1 buổi" },
  { value: "afternoon", label: "Buổi chiều", hint: "1 buổi" },
];

export function WorkDayScheduleEditor({
  date,
  entry,
  readOnly,
  readOnlyReason,
  onChange,
  onClear,
  tone = "default",
  saved = false,
}: WorkDayScheduleEditorProps) {
  const hasWorkSelection = entry.type === "office" || entry.type === "remote";

  return (
    <View className="border-t border-slate-100 pt-4">
      <View className="mb-3 flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-[11px] font-black uppercase tracking-wider text-slate-500">
            Lịch làm trong ngày
          </Text>
          <Text className="mt-1 text-lg font-black capitalize text-slate-900">
            {date.toLocaleDateString("vi-VN", {
              weekday: "long",
              day: "2-digit",
              month: "2-digit",
            })}
          </Text>
        </View>
        <View
          className={`rounded-full px-2.5 py-1 ${
            hasWorkSelection ? "bg-emerald-50" : "bg-slate-100"
          }`}
        >
          <Text
            className={`text-[10px] font-black ${
              hasWorkSelection ? "text-emerald-700" : "text-slate-500"
            }`}
          >
            {hasWorkSelection
              ? saved
                ? "Đã gửi"
                : "Đã chọn · Chưa gửi"
              : "Ngày nghỉ"}
          </Text>
        </View>
      </View>

      {readOnlyReason ? (
        <View className="mb-4 flex-row items-start rounded-2xl bg-slate-100 p-3">
          <Ionicons
            name="information-circle-outline"
            size={16}
            color="#64748b"
          />
          <Text className="ml-2 flex-1 text-xs font-semibold leading-5 text-slate-600">
            {readOnlyReason}
          </Text>
        </View>
      ) : (
        <Text className="mb-3 text-xs leading-5 text-slate-500">
          Chọn nơi làm việc và ca làm. Bạn có thể thay đổi trước khi gửi lịch.
        </Text>
      )}

      <Text className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">
        Nơi làm việc
      </Text>
      <View className="flex-row flex-wrap justify-between">
        {WORK_OPTIONS.map((option) => {
          const selected = entry.type === option.value;
          return (
            <Pressable
              className={`mb-3 min-h-[124px] w-[48.5%] rounded-2xl border p-4 ${
                selected ? option.selectedBox : "border-slate-200 bg-white"
              }`}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected, disabled: readOnly }}
              disabled={readOnly}
              key={option.value}
              onPress={() => onChange("type", option.value)}
              style={readOnly ? { opacity: 0.6 } : undefined}
            >
              <View className="mb-3 flex-row items-center justify-between">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-white">
                  <Ionicons name={option.icon} size={18} color={option.color} />
                </View>
                <View className="h-6 w-6 items-center justify-center">
                  {selected ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={23}
                      color={option.color}
                    />
                  ) : null}
                </View>
              </View>
              <Text className="text-sm font-black text-slate-800">
                {option.label}
              </Text>
              <Text className="mt-0.5 text-[10px] leading-4 text-slate-500">
                {option.description}
              </Text>
              {selected ? (
                <Text
                  className="mt-2 text-[10px] font-black"
                  style={{ color: option.color }}
                >
                  Đang chọn
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {hasWorkSelection ? (
        <View>
          {!readOnly ? (
            <Pressable
              accessibilityRole="button"
              className="mb-3 min-h-10 flex-row items-center justify-center rounded-xl border border-slate-200 bg-white px-3"
              onPress={onClear}
            >
              <Ionicons name="calendar-clear-outline" size={16} color="#64748b" />
              <Text className="ml-2 text-xs font-bold text-slate-600">
                Đặt ngày này là ngày nghỉ
              </Text>
            </Pressable>
          ) : null}

          <View className="mt-1">
            <Text className="mb-2 text-xs font-bold text-slate-700">
              Ca làm
            </Text>
            <View className="flex-row rounded-2xl bg-slate-100 p-1">
              {PERIOD_OPTIONS.map((option) => {
                const selected = (entry.period || "full_day") === option.value;
                return (
                  <Pressable
                    className={`flex-1 items-center rounded-xl border px-2 py-2.5 ${
                      selected
                        ? "border-blue-100 bg-white"
                        : "border-transparent bg-transparent"
                    }`}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected, disabled: readOnly }}
                    disabled={readOnly}
                    key={option.value}
                    onPress={() => onChange("period", option.value)}
                    style={readOnly ? { opacity: 0.6 } : undefined}
                  >
                    <Text
                      className={`text-[11px] font-black ${
                        selected
                          ? tone === "admin"
                            ? "text-red-700"
                            : "text-blue-600"
                          : "text-slate-500"
                      }`}
                    >
                      {option.label}
                    </Text>
                    <Text className="mt-0.5 text-[9px] text-slate-400">
                      {option.hint}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="mt-4">
            <Text className="mb-2 text-xs font-bold text-slate-700">
              Ghi chú{" "}
              <Text className="font-normal text-slate-400">
                (không bắt buộc)
              </Text>
            </Text>
            <TextInput
              className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800"
              editable={!readOnly}
              maxLength={200}
              onChangeText={(text) => onChange("note", text)}
              placeholder="Ví dụ: họp với khách hàng lúc 9:00"
              placeholderTextColor="#94a3b8"
              style={readOnly ? { opacity: 0.6 } : undefined}
              value={entry.note || ""}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}
