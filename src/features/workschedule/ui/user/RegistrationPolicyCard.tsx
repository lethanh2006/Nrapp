import { formatDateTimeVi } from "@/src/features/workschedule/utils/date";
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
  className = "",
}: RegistrationPolicyCardProps) {
  return (
    <View
      className={`rounded-3xl border p-4 ${
        closed
          ? "border-rose-100 bg-rose-50"
          : "border-emerald-100 bg-emerald-50"
      } ${className}`}
    >
      <View className="flex-row items-start">
        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white">
          <Ionicons
            name={closed ? "lock-closed" : "checkmark-circle"}
            size={22}
            color={closed ? "#e11d48" : "#059669"}
          />
        </View>
        <View className="ml-3 flex-1">
          <Text
            className={`text-sm font-black ${
              closed ? "text-rose-800" : "text-emerald-800"
            }`}
          >
            {closed ? "Đăng ký đang tạm khóa" : "Đang mở đăng ký lịch"}
          </Text>
          <Text
            className={`mt-1 text-xs leading-5 ${
              closed ? "text-rose-600" : "text-emerald-700"
            }`}
          >
            {closed
              ? "Bạn vẫn có thể xem lại các lịch đã gửi trước đó."
              : `Hạn đăng ký: ${formatDateTimeVi(policy.registration_end)}`}
          </Text>
        </View>
      </View>
    </View>
  );
}
