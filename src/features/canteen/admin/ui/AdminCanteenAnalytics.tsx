import { useAuthSession } from "@/src/features/auth/model/AuthSessionContext";
import {
  formatMoney,
  getCanteenErrorMessage,
} from "@/src/features/canteen/shared/model/presentation";
import {
  getCanteenTopDishes,
  type CanteenDishSalesSummary,
} from "@/src/services/canteen/analytics.service";
import { AppAlert as Alert } from "@/src/shared/ui/AppAlert";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

type Props = {
  refreshKey?: number;
};

const LIMIT_OPTIONS = [5, 10, 20] as const;

export default function AdminCanteenAnalytics({ refreshKey = 0 }: Props) {
  const { getToken } = useAuthSession();
  const [limit, setLimit] = useState<number>(10);
  const [dishes, setDishes] = useState<CanteenDishSalesSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTopDishes = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) setLoading(true);
        const token = await getToken();
        if (!token) return;
        setDishes(await getCanteenTopDishes(token, limit));
      } catch (error) {
        Alert.alert(
          "Lỗi",
          getCanteenErrorMessage(error, "Không tải được thống kê món ăn"),
        );
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [getToken, limit],
  );

  useEffect(() => {
    void loadTopDishes();
  }, [loadTopDishes, refreshKey]);

  const totals = useMemo(
    () =>
      dishes.reduce(
        (result, dish) => ({
          quantity: result.quantity + dish.salesCount,
          revenue: result.revenue + dish.totalRevenue,
        }),
        { quantity: 0, revenue: 0 },
      ),
    [dishes],
  );

  if (loading) {
    return (
      <View className="items-center py-20">
        <ActivityIndicator color="#dc2626" size="large" />
      </View>
    );
  }

  return (
    <View>
      <View
        className="mb-4 overflow-hidden rounded-3xl border border-red-100 bg-white p-4 shadow-sm"
        style={{ elevation: 2 }}
      >
        <View className="absolute -right-10 -top-12 h-28 w-28 rounded-full bg-red-50" />
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-base font-black text-slate-900">
              Món được đặt nhiều
            </Text>
            <Text className="mt-1 text-xs leading-5 text-slate-500">
              Dữ liệu từ đơn chưa bị hủy, chưa phải báo cáo hoàn tất hoặc đối soát.
            </Text>
          </View>
          <Pressable
            accessibilityLabel="Tải lại thống kê"
            className="h-10 w-10 items-center justify-center rounded-xl bg-red-50 active:bg-red-100"
            onPress={() => loadTopDishes()}
          >
            <Ionicons color="#dc2626" name="refresh" size={17} />
          </Pressable>
        </View>
        <View className="mt-4 flex-row">
          <View className="mr-2 flex-1 rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <Text className="text-[10px] font-black uppercase text-slate-500">
              Số lượng trong top
            </Text>
            <Text className="mt-1 text-lg font-black text-slate-900">
              {totals.quantity} món
            </Text>
          </View>
          <View className="flex-1 rounded-2xl border border-red-100 bg-red-50 p-3">
            <Text className="text-[10px] font-black uppercase text-red-500">
              Giá trị món gộp
            </Text>
            <Text className="mt-1 text-lg font-black text-red-700">
              {formatMoney(totals.revenue)}
            </Text>
          </View>
        </View>
      </View>

      <Text className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
        Số món hiển thị
      </Text>
      <View className="mb-4 flex-row">
        {LIMIT_OPTIONS.map((option) => (
          <Pressable
            className={`mr-2 rounded-full border px-4 py-2 ${
              limit === option
                ? "border-red-500 bg-red-50"
                : "border-slate-200 bg-white"
            }`}
            key={option}
            onPress={() => setLimit(option)}
          >
            <Text
              className={`text-xs font-black ${
                limit === option ? "text-red-600" : "text-slate-500"
              }`}
            >
              Top {option}
            </Text>
          </Pressable>
        ))}
      </View>

      {dishes.length === 0 ? (
        <View className="items-center rounded-3xl bg-white py-14">
          <Ionicons color="#cbd5e1" name="stats-chart-outline" size={42} />
          <Text className="mt-3 text-sm font-semibold text-slate-400">
            Chưa có dữ liệu đặt món
          </Text>
        </View>
      ) : (
        dishes.map((dish, index) => (
          <View
            className="mb-3 flex-row items-center rounded-3xl border border-slate-100 bg-white p-4"
            key={dish.menuItemId}
          >
            <View
              className={`h-11 w-11 items-center justify-center rounded-2xl ${
                index < 3 ? "bg-red-50" : "bg-slate-100"
              }`}
            >
              <Text
                className={`text-base font-black ${
                  index < 3 ? "text-red-600" : "text-slate-500"
                }`}
              >
                #{index + 1}
              </Text>
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-sm font-black text-slate-900">
                {dish.name}
              </Text>
              <Text className="mt-1 text-xs font-semibold text-slate-400">
                {dish.salesCount} phần trong đơn
              </Text>
            </View>
            <Text className="text-xs font-black text-emerald-700">
              {formatMoney(dish.totalRevenue)}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}
