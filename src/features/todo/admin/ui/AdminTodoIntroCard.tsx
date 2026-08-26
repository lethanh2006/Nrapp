import type { AppArea } from "@/src/application/access/roles";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

type Props = {
  area: AppArea;
};

export default function AdminTodoIntroCard({ area }: Props) {
  return (
    <View className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100/60 flex-row items-center">
      <View className="bg-blue-500/10 p-2.5 rounded-xl mr-3">
        <Ionicons name="clipboard-outline" size={24} color="#3b82f6" />
      </View>
      <View className="flex-1">
        <Text className="text-lg font-bold text-slate-800">Không gian công việc</Text>
        <Text className="text-xs text-slate-500 mt-0.5 leading-relaxed">
          {area === "admin"
            ? "Chế độ quản trị: Tạo mới, bàn giao và giám sát tiến độ công việc toàn hệ thống."
            : "Chế độ nhân viên: Theo dõi, thực hiện và cập nhật trạng thái công việc được giao."}
        </Text>
      </View>
    </View>
  );
}
