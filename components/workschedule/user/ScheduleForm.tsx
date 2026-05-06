import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { EntryType, IScheduleEntry } from "../types";

interface Props {
  startDate: Date;
  entries: IScheduleEntry[];
  onChangeEntry: (date: string, field: "type" | "note", value: string) => void;
  readOnly?: boolean;
}

const typeOptions: { value: EntryType; label: string; color: string }[] = [
  { value: "office", label: "Lên cty", color: "bg-blue-100 text-blue-800" },
  { value: "remote", label: "Từ xa", color: "bg-purple-100 text-purple-800" },
  { value: "day_off", label: "Nghỉ", color: "bg-gray-100 text-gray-800" },
  { value: "leave", label: "Phép", color: "bg-orange-100 text-orange-800" },
];

const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export default function ScheduleForm({
  startDate,
  entries,
  onChangeEntry,
  readOnly = false,
}: Props) {
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <View className="gap-4">
      {days.map((date) => {
        const dateStr = date.toISOString().split("T")[0];
        const entry = entries.find((e) => e.date.startsWith(dateStr)) || {
          date: dateStr,
          type: "office",
          note: "",
        };

        return (
          <View
            key={dateStr}
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100"
          >
            <View className="flex-row items-center mb-3">
              <View className="w-12 h-12 bg-blue-50 rounded-lg items-center justify-center mr-3">
                <Text className="text-xs text-blue-600 font-bold">
                  {dayNames[date.getDay()]}
                </Text>
                <Text className="text-lg text-blue-900 font-bold">
                  {date.getDate()}
                </Text>
              </View>
              <Text className="text-base font-medium flex-1">
                Tháng {date.getMonth() + 1}, {date.getFullYear()}
              </Text>
            </View>

            <View className="flex-row flex-wrap gap-2 mb-3">
              {typeOptions.map((opt) => {
                const isSelected = entry.type === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    disabled={readOnly}
                    onPress={() => onChangeEntry(dateStr, "type", opt.value)}
                    className={`px-3 py-1.5 rounded-lg border ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white"
                    } ${readOnly ? "opacity-70" : ""}`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        isSelected ? "text-blue-700" : "text-gray-600"
                      }`}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-800"
              placeholder="Ghi chú (tùy chọn)"
              value={entry.note}
              editable={!readOnly}
              onChangeText={(text) => onChangeEntry(dateStr, "note", text)}
            />
          </View>
        );
      })}
    </View>
  );
}
