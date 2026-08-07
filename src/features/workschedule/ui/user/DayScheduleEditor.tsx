import type {
  EntryType,
  IScheduleEntry,
  WorkPeriod,
} from "@/src/services/workschedule/constant";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

type IconName = ComponentProps<typeof Ionicons>["name"];

type DayScheduleEditorProps = {
  date: Date;
  entry: Partial<IScheduleEntry>;
  readOnly: boolean;
  readOnlyReason?: string | null;
  hasNext: boolean;
  onChange: (field: "type" | "period" | "note", value: string) => void;
  onNext: () => void;
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
  {
    value: "day_off",
    label: "Ngày nghỉ",
    description: "Không làm việc",
    icon: "sunny",
    color: "#64748b",
    selectedBox: "border-slate-500 bg-slate-100",
  },
  {
    value: "leave",
    label: "Nghỉ phép",
    description: "Sử dụng ngày phép",
    icon: "cafe",
    color: "#ea580c",
    selectedBox: "border-orange-500 bg-orange-50",
  },
];

const PERIOD_OPTIONS: { value: WorkPeriod; label: string; hint: string }[] = [
  { value: "full_day", label: "Cả ngày", hint: "2 buổi" },
  { value: "morning", label: "Buổi sáng", hint: "1 buổi" },
  { value: "afternoon", label: "Buổi chiều", hint: "1 buổi" },
];

export function DayScheduleEditor({
  date,
  entry,
  readOnly,
  readOnlyReason,
  hasNext,
  onChange,
  onNext,
}: DayScheduleEditorProps) {
  return (
    <View className="mt-4 border-t border-slate-100 pt-4">
      <View className="mb-3 flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-[11px] font-black uppercase tracking-wider text-red-600">
            Thiết lập cho ngày
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
            entry.type ? "bg-emerald-50" : "bg-amber-50"
          }`}
        >
          <Text
            className={`text-[10px] font-black ${
              entry.type ? "text-emerald-700" : "text-amber-700"
            }`}
          >
            {entry.type ? "Đã chọn" : "Chưa chọn"}
          </Text>
        </View>
      </View>

      {readOnlyReason ? (
        <View className="mb-4 flex-row items-start rounded-2xl bg-slate-100 p-3">
          <Ionicons name="lock-closed" size={15} color="#64748b" />
          <Text className="ml-2 flex-1 text-xs font-semibold leading-5 text-slate-600">
            {readOnlyReason}
          </Text>
        </View>
      ) : (
        <Text className="mb-3 text-xs leading-5 text-slate-500">
          Bạn sẽ làm việc theo hình thức nào?
        </Text>
      )}

      <View className="flex-row flex-wrap justify-between">
        {WORK_OPTIONS.map((option) => {
          const selected = entry.type === option.value;
          return (
            <Pressable
              className={`mb-3 w-[48.5%] rounded-2xl border p-3 ${
                selected ? option.selectedBox : "border-slate-200 bg-white"
              } ${readOnly ? "opacity-60" : ""}`}
              disabled={readOnly}
              key={option.value}
              onPress={() => onChange("type", option.value)}
            >
              <View className="mb-3 flex-row items-center justify-between">
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-white">
                  <Ionicons name={option.icon} size={18} color={option.color} />
                </View>
                {selected ? (
                  <Ionicons name="checkmark-circle" size={20} color={option.color} />
                ) : (
                  <View className="h-5 w-5 rounded-full border-2 border-slate-200" />
                )}
              </View>
              <Text className="text-sm font-black text-slate-800">
                {option.label}
              </Text>
              <Text className="mt-0.5 text-[10px] leading-4 text-slate-500">
                {option.description}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="mt-1">
        <Text className="mb-2 text-xs font-bold text-slate-700">Ca đăng ký</Text>
        <View className="flex-row rounded-2xl bg-slate-100 p-1">
          {PERIOD_OPTIONS.map((option) => {
            const selected = (entry.period || "full_day") === option.value;
            return (
              <Pressable
                className={`flex-1 items-center rounded-xl px-2 py-2.5 ${
                  selected ? "bg-white shadow-sm" : "bg-transparent"
                } ${readOnly ? "opacity-60" : ""}`}
                disabled={readOnly}
                key={option.value}
                onPress={() => onChange("period", option.value)}
              >
                <Text
                  className={`text-[11px] font-black ${
                    selected ? "text-red-600" : "text-slate-500"
                  }`}
                >
                  {option.label}
                </Text>
                <Text className="mt-0.5 text-[9px] text-slate-400">{option.hint}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="mt-4">
        <Text className="mb-2 text-xs font-bold text-slate-700">
          Ghi chú <Text className="font-normal text-slate-400">(không bắt buộc)</Text>
        </Text>
        <TextInput
          className={`min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 ${
            readOnly ? "opacity-60" : ""
          }`}
          editable={!readOnly}
          maxLength={200}
          onChangeText={(text) => onChange("note", text)}
          placeholder="Ví dụ: họp với khách hàng lúc 9:00"
          placeholderTextColor="#94a3b8"
          value={entry.note || ""}
        />
      </View>

      {!readOnly && hasNext ? (
        <Pressable
          className="mt-4 flex-row items-center justify-center rounded-2xl bg-slate-900 py-3.5 active:opacity-80"
          onPress={onNext}
        >
          <Text className="mr-1 text-sm font-black text-white">Ngày tiếp theo</Text>
          <Ionicons name="arrow-forward" size={17} color="white" />
        </Pressable>
      ) : null}
    </View>
  );
}
