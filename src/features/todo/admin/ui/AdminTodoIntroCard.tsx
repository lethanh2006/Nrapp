import type { AppArea } from "@/src/application/access/roles";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

type Props = {
  area: AppArea;
};

export default function AdminTodoIntroCard({ area }: Props) {
  if (area === "admin") {
    return (
      <View className="overflow-hidden rounded-3xl bg-red-950 p-5 shadow-sm">
        <View className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-red-700/40" />
        <View className="absolute -bottom-12 right-12 h-28 w-28 rounded-full bg-red-900/60" />
        <View className="flex-row items-center">
          <View className="mr-3 h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
            <Ionicons name="clipboard-outline" size={24} color="#fecaca" />
          </View>
          <View className="flex-1">
            <Text className="text-[10px] font-black uppercase tracking-[2px] text-red-200">
              Điều phối công việc
            </Text>
            <Text className="mt-1 text-lg font-black text-white">
              Không gian quản trị
            </Text>
            <Text className="mt-1 text-xs leading-relaxed text-white/65">
              Tạo mới, bàn giao và giám sát tiến độ công việc toàn hệ thống.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100/60 flex-row items-center">
      <View className="bg-blue-500/10 p-2.5 rounded-xl mr-3">
        <Ionicons name="clipboard-outline" size={24} color="#3b82f6" />
      </View>
      <View className="flex-1">
        <Text className="text-lg font-bold text-slate-800">Không gian công việc</Text>
        <Text className="text-xs text-slate-500 mt-0.5 leading-relaxed">
          Chế độ nhân viên: Theo dõi, thực hiện và cập nhật trạng thái công việc
          được giao.
        </Text>
      </View>
    </View>
  );
}
