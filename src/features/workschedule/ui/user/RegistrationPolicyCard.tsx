import {
  formatDateTimeVi,
  formatDateVi,
} from "@/src/features/workschedule/utils/date";
import type { IWorkPolicy } from "@/src/services/workschedule/constant";
import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

type RegistrationPolicyCardProps = {
  policy: IWorkPolicy;
  closed: boolean;
  allowedWeeks: { start: Date; end: Date };
  className?: string;
};

export function RegistrationPolicyCard({
  policy,
  closed,
  allowedWeeks,
  className = "",
}: RegistrationPolicyCardProps) {
  return (
    <View
      className={`rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs ${className}`}
    >
      <View className="mb-3 flex-row items-center justify-between border-b border-slate-100 pb-3">
        <View className="flex-row items-center">
          <View className="rounded-xl bg-blue-50 p-1.5">
            <Ionicons
              name="information-circle-outline"
              size={16}
              color="#2563eb"
            />
          </View>
          <Text className="ml-1.5 text-xs font-black text-slate-800">
            Thông tin đăng ký lịch
          </Text>
        </View>
        <View
          className={`rounded-full border px-2.5 py-0.5 ${
            closed
              ? "border-rose-100 bg-rose-50"
              : "border-emerald-100 bg-emerald-50"
          }`}
        >
          <Text
            className={`text-[10px] font-black uppercase ${
              closed ? "text-rose-600" : "text-emerald-600"
            }`}
          >
            {closed ? "Đang Khóa" : "Đang Mở"}
          </Text>
        </View>
      </View>

      <View className="gap-3">
        <View className="flex-row items-start">
          <View className="mt-0.5 rounded-2xl border border-slate-100 bg-slate-50 p-2">
            <Ionicons name="time-outline" size={16} color="#64748b" />
          </View>
          <View className="ml-2 flex-1">
            <Text className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Thời gian mở cổng đăng ký
            </Text>
            <Text className="mt-0.5 text-xs font-bold text-slate-700">
              Từ {formatDateTimeVi(policy.registration_start)} đến{" "}
              {formatDateTimeVi(policy.registration_end)}
            </Text>
          </View>
        </View>

        <View className="flex-row items-start">
          <View className="mt-0.5 rounded-2xl border border-slate-100 bg-slate-50 p-2">
            <Ionicons name="calendar-outline" size={16} color="#64748b" />
          </View>
          <View className="ml-2 flex-1">
            <Text className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Phạm vi các tuần được đăng ký
            </Text>
            <Text className="mt-0.5 text-xs font-bold text-slate-700">
              Tuần từ{" "}
              <Text className="font-extrabold text-blue-600">
                {formatDateVi(allowedWeeks.start)}
              </Text>{" "}
              đến tuần{" "}
              <Text className="font-extrabold text-blue-600">
                {formatDateVi(allowedWeeks.end)}
              </Text>
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
