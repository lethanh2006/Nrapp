import { formatDateVi } from "@/src/features/workschedule/shared/utils/date";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

type AdminWeekPickerProps = {
  weekStart: Date;
  index: number;
  total: number;
  statusLabel: string;
  statusBoxClassName: string;
  statusTextClassName: string;
  onPrevious: () => void;
  onNext: () => void;
};

const getWeekHint = (weekStart: Date) => {
  const currentMonday = new Date();
  const day = currentMonday.getDay();
  currentMonday.setDate(currentMonday.getDate() - (day === 0 ? 6 : day - 1));
  currentMonday.setHours(0, 0, 0, 0);
  const difference = Math.round(
    (weekStart.getTime() - currentMonday.getTime()) / (7 * 24 * 60 * 60 * 1000),
  );
  if (difference === 0) return "Tuần này";
  if (difference === 1) return "Tuần sau";
  return `Sau ${difference} tuần`;
};

export function AdminWeekPicker({
  weekStart,
  index,
  total,
  statusLabel,
  statusBoxClassName,
  statusTextClassName,
  onPrevious,
  onNext,
}: AdminWeekPickerProps) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const canPrevious = index > 0;
  const canNext = index < total - 1;

  return (
    <View className="rounded-3xl border border-slate-200 bg-white p-4">
      <View className="mb-4 flex-row items-center">
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-red-50">
          <Ionicons name="calendar-number-outline" size={18} color="#dc2626" />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-base font-black text-slate-900">
            Kỳ đăng ký cá nhân
          </Text>
          <Text className="mt-0.5 text-xs text-slate-400">
            Chọn tuần trong phạm vi chính sách hiện hành
          </Text>
        </View>
      </View>

      <View className="flex-row items-center rounded-2xl border border-slate-200 bg-slate-50 p-2">
        <Pressable
          accessibilityLabel="Tuần trước"
          disabled={!canPrevious}
          onPress={onPrevious}
          className={`h-11 w-11 items-center justify-center rounded-xl bg-white ${
            canPrevious ? "opacity-100" : "opacity-30"
          }`}
        >
          <Ionicons name="chevron-back" size={20} color="#dc2626" />
        </Pressable>
        <View className="flex-1 items-center px-2">
          <Text className="text-[11px] font-black uppercase tracking-wider text-red-600">
            {getWeekHint(weekStart)}
          </Text>
          <Text className="mt-1 text-base font-black text-slate-900">
            {formatDateVi(weekStart)} - {formatDateVi(weekEnd)}
          </Text>
        </View>
        <Pressable
          accessibilityLabel="Tuần sau"
          disabled={!canNext}
          onPress={onNext}
          className={`h-11 w-11 items-center justify-center rounded-xl bg-white ${
            canNext ? "opacity-100" : "opacity-30"
          }`}
        >
          <Ionicons name="chevron-forward" size={20} color="#dc2626" />
        </Pressable>
      </View>

      <View className="mt-3 flex-row items-center justify-between">
        <View className="flex-row items-center">
          {Array.from({ length: total }).map((_, itemIndex) => (
            <View
              className={`mr-1.5 h-1.5 rounded-full ${
                itemIndex === index ? "w-5 bg-red-600" : "w-1.5 bg-slate-200"
              }`}
              key={itemIndex}
            />
          ))}
        </View>
        <View className={`rounded-full px-2.5 py-1 ${statusBoxClassName}`}>
          <Text className={`text-[10px] font-black uppercase ${statusTextClassName}`}>
            {statusLabel}
          </Text>
        </View>
      </View>
    </View>
  );
}
