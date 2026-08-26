import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightSlot?: ReactNode;
};

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  rightSlot,
}: ScreenHeaderProps) {
  return (
    <View className="min-h-16 flex-row items-center border-b border-slate-100 bg-white px-4 py-3">
      {onBack ? (
        <Pressable
          accessibilityLabel="Quay lại"
          accessibilityRole="button"
          className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-slate-100 active:bg-slate-200"
          hitSlop={8}
          onPress={onBack}
        >
          <Ionicons name="arrow-back" size={20} color="#334155" />
        </Pressable>
      ) : null}

      <View className="min-w-0 flex-1">
        <Text
          className="text-lg font-black tracking-tight text-slate-900"
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text className="mt-0.5 text-[11px] leading-4 text-slate-500" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {rightSlot ? <View className="ml-3">{rightSlot}</View> : null}
    </View>
  );
}
