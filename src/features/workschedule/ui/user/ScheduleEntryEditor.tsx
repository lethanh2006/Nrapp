import { SCHEDULE_TYPE_OPTIONS } from "@/src/services/workschedule/constant";
import type {
  EntryType,
  IScheduleEntry,
} from "@/src/services/workschedule/constant";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, TextInput, View } from "react-native";

type ScheduleEntryEditorProps = {
  date: Date;
  entry: Partial<IScheduleEntry>;
  weekStatus: string;
  readOnly: boolean;
  readOnlyReason: string | null;
  saving: boolean;
  onChange: (field: "type" | "note", value: string) => void;
  onSave: () => void;
};

const STATUS_STYLES: Record<string, { box: string; text: string; label: string }> =
  {
    approved: {
      box: "border-emerald-100 bg-emerald-50",
      text: "text-emerald-600",
      label: "Đã duyệt",
    },
    pending: {
      box: "border-amber-100 bg-amber-50",
      text: "text-amber-600",
      label: "Chờ duyệt",
    },
    draft: {
      box: "border-slate-200 bg-slate-100",
      text: "text-slate-600",
      label: "Bản nháp",
    },
    none: {
      box: "border-gray-100 bg-gray-50",
      text: "text-gray-500",
      label: "Chưa tạo",
    },
  };

export function ScheduleEntryEditor({
  date,
  entry,
  weekStatus,
  readOnly,
  readOnlyReason,
  saving,
  onChange,
  onSave,
}: ScheduleEntryEditorProps) {
  const status = STATUS_STYLES[weekStatus] || STATUS_STYLES.none;

  return (
    <View className="mx-4 mb-24 mt-3 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <View className="mb-4 flex-row items-center justify-between border-b border-slate-50 pb-2">
        <View>
          <Text className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Cài đặt lịch
          </Text>
          <Text className="text-sm font-black text-slate-800">
            {date.toLocaleDateString("vi-VN", {
              weekday: "long",
              day: "numeric",
              month: "numeric",
            })}
          </Text>
        </View>
        <View className={`rounded-full border px-2.5 py-1 ${status.box}`}>
          <Text className={`text-[10px] font-extrabold uppercase ${status.text}`}>
            {status.label}
          </Text>
        </View>
      </View>

      {readOnlyReason && (
        <View className="mb-4 flex-row items-center rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <Ionicons name="lock-closed" size={14} color="#64748b" />
          <Text className="ml-1.5 flex-1 text-[11px] font-black text-slate-500">
            Chỉ xem: {readOnlyReason}
          </Text>
        </View>
      )}

      <View className="gap-4">
        <View className="flex-row flex-wrap gap-2.5">
          {SCHEDULE_TYPE_OPTIONS.filter(
            (option) =>
              option.value === "office" || option.value === "remote",
          ).map((option) => {
            const selected = entry.type === option.value;
            const nextType: EntryType = selected ? "day_off" : option.value;
            return (
              <Pressable
                key={option.value}
                disabled={readOnly}
                onPress={() => onChange("type", nextType)}
                className={`min-w-[120px] flex-1 flex-row items-center justify-between rounded-2xl border p-3 ${
                  selected
                    ? "border-slate-900 bg-slate-900"
                    : "border-slate-200/60 bg-slate-50"
                } ${readOnly ? "opacity-60" : ""}`}
              >
                <View className="flex-row items-center">
                  <Ionicons
                    name={option.icon}
                    size={16}
                    color={selected ? "#fff" : "#64748b"}
                  />
                  <Text
                    className={`ml-1.5 text-xs font-black ${
                      selected ? "text-white" : "text-slate-600"
                    }`}
                  >
                    {option.label}
                  </Text>
                </View>
                {selected && (
                  <Ionicons name="checkmark-circle" size={14} color="#fff" />
                )}
              </Pressable>
            );
          })}
        </View>

        <View>
          <Text className="mb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Ghi chú công việc
          </Text>
          <TextInput
            value={entry.note}
            editable={!readOnly}
            onChangeText={(text) => onChange("note", text)}
            placeholder={
              readOnly
                ? "Không có ghi chú"
                : "Nhập ghi chú công việc (Ví dụ: Remote buổi sáng...)"
            }
            className={`rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3.5 text-xs font-bold text-slate-800 ${
              readOnly ? "opacity-60" : ""
            }`}
          />
        </View>

        {!readOnly && (
          <Pressable
            onPress={onSave}
            disabled={saving}
            className="mt-2 flex-row items-center justify-center rounded-2xl bg-blue-600 py-4 shadow-md"
          >
            <Ionicons name="save-outline" size={16} color="white" />
            <Text className="ml-1 text-xs font-extrabold text-white">
              {saving ? "Đang xử lý..." : "Đăng ký lịch nháp"}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
