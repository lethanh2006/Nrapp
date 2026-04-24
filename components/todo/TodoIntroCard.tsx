import React from "react";
import { Text, View } from "react-native";

type Props = {
  isAdmin: boolean;
};

export default function TodoIntroCard({ isAdmin }: Props) {
  return (
    <View className="bg-gray-100 rounded-2xl p-4 border border-gray-200">
      <Text className="text-xl font-semibold text-black">Todo</Text>
      <Text className="text-gray-600 mt-1">
        {isAdmin
          ? "Che do admin: tao, giao va quan ly toan bo cong viec"
          : "Che do user: theo doi va cap nhat cong viec duoc giao"}
      </Text>
    </View>
  );
}
