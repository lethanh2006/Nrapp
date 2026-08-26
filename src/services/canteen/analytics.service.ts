import { getAuthHeader } from "@/src/utils/apiHelper";
import axios from "@/src/utils/axios";
import { ipNR } from "@/src/utils/ip";

export interface CanteenDishSalesSummary {
  menuItemId: string;
  name: string;
  salesCount: number;
  totalRevenue: number;
}

export async function getCanteenTopDishes(token: string, limit = 10) {
  const { data } = await axios.get<CanteenDishSalesSummary[]>(
    `${ipNR}/canteen/analytics/top-dishes`,
    { ...getAuthHeader(token), params: { limit } },
  );
  return Array.isArray(data) ? data : [];
}
