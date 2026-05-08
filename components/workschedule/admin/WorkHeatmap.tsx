import React from "react";
import { View, Text } from "react-native";
import { useAdminData } from "@/context/AdminContext";

const entryLabels: Record<string, string> = {
  office: "Lên công ty",
  remote: "Từ xa",
  day_off: "Nghỉ",
  leave: "Phép",
};

const getEntryColor = (type: string) => {
  const base = {
    office: "bg-blue-50 border-blue-200 text-blue-900",
    remote: "bg-violet-50 border-violet-200 text-violet-900",
    day_off: "bg-slate-50 border-slate-200 text-slate-900",
    leave: "bg-amber-50 border-amber-200 text-amber-900",
  } as Record<string, string>;
  return base[type] || base.office;
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("vi-VN");
};

export function WorkHeatmap() {
  const { heatmapRows, selectedWeek } = useAdminData();

  return (
    <View className="bg-white rounded-3xl p-5 border border-slate-200">
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <Text className="text-lg font-bold text-slate-900">
            Heatmap lịch làm việc
          </Text>
          <Text className="text-slate-500 mt-1">
            Dữ liệu phân tích theo tuần đã chọn.
          </Text>
        </View>
        <View className="bg-slate-100 rounded-full px-3 py-1">
          <Text className="text-slate-700 text-xs font-semibold">
            {selectedWeek}
          </Text>
        </View>
      </View>

      {heatmapRows.length === 0 ? (
        <Text className="text-slate-500">
          Chưa có dữ liệu heatmap cho tuần này.
        </Text>
      ) : (
        <View style={{ gap: 12 }}>
          {heatmapRows.map((row) => {
            const total = row.stats.reduce(
              (sum, stat) => sum + stat.count,
              0,
            );
            return (
              <View
                key={row._id}
                className="rounded-2xl border border-slate-200 p-4 bg-slate-50"
              >
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-slate-900 font-semibold">
                    {formatDate(row._id)}
                  </Text>
                  <Text className="text-slate-500 text-sm">Tổng {total}</Text>
                </View>
                <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                  {row.stats.map((stat) => (
                    <View
                      key={stat.type}
                      className={`rounded-2xl border px-3 py-2 min-w-[110px] ${getEntryColor(stat.type)}`}
                    >
                      <Text className="text-xs uppercase tracking-[2px] opacity-80">
                        {entryLabels[stat.type] || stat.type}
                      </Text>
                      <View className="h-1.5 rounded-full mt-2 bg-slate-900" />
                      <Text className="font-semibold mt-2">
                        {stat.count} lượt
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
