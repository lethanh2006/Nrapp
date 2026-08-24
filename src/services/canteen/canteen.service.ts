import type {
  CanteenOrder,
  CreateOrderInput,
  MenuGroup,
  MenuItem,
  OrderListQuery,
  PaginatedOrders,
} from "@/src/services/canteen/constant";
import { getAuthHeader } from "@/src/utils/apiHelper";
import axios from "@/src/utils/axios";
import { ipNR } from "@/src/utils/ip";

export async function getCanteenMenu() {
  const { data } = await axios.get<MenuGroup[]>(`${ipNR}/canteen/menu`);
  return Array.isArray(data) ? data : [];
}

export async function searchCanteenMenu(query: string) {
  const { data } = await axios.get<MenuItem[]>(`${ipNR}/canteen/menu/search`, {
    params: { q: query.trim() },
  });
  return Array.isArray(data) ? data : [];
}

export async function createCanteenOrder(
  token: string,
  payload: CreateOrderInput,
) {
  const { data } = await axios.post<CanteenOrder>(
    `${ipNR}/canteen/orders`,
    payload,
    getAuthHeader(token),
  );
  return data;
}

export async function getMyCanteenOrders(token: string) {
  const { data } = await axios.get<CanteenOrder[]>(
    `${ipNR}/canteen/orders/my-orders`,
    getAuthHeader(token),
  );
  return Array.isArray(data) ? data : [];
}

export async function getCanteenOrder(token: string, orderId: string) {
  const { data } = await axios.get<CanteenOrder>(
    `${ipNR}/canteen/orders/${encodeURIComponent(orderId)}`,
    getAuthHeader(token),
  );
  return data;
}

export async function cancelCanteenOrder(
  token: string,
  orderId: string,
  reason?: string,
) {
  const { data } = await axios.patch<CanteenOrder>(
    `${ipNR}/canteen/orders/${encodeURIComponent(orderId)}/cancel`,
    { reason: reason?.trim() || undefined },
    getAuthHeader(token),
  );
  return data;
}

export async function listCanteenOrders(
  token: string,
  params: OrderListQuery = {},
) {
  const { data } = await axios.get<PaginatedOrders>(
    `${ipNR}/canteen/orders`,
    { ...getAuthHeader(token), params },
  );
  return data;
}

export async function confirmCanteenOrder(token: string, orderId: string) {
  const { data } = await axios.patch<CanteenOrder>(
    `${ipNR}/canteen/orders/${encodeURIComponent(orderId)}/confirm`,
    {},
    getAuthHeader(token),
  );
  return data;
}

export async function completeCanteenOrder(token: string, orderId: string) {
  const { data } = await axios.patch<CanteenOrder>(
    `${ipNR}/canteen/orders/${encodeURIComponent(orderId)}/complete`,
    {},
    getAuthHeader(token),
  );
  return data;
}

export async function getKitchenQueue(token: string) {
  const { data } = await axios.get<CanteenOrder[]>(
    `${ipNR}/canteen/kitchen/queue`,
    getAuthHeader(token),
  );
  return Array.isArray(data) ? data : [];
}

export async function getNextKitchenOrder(token: string) {
  const { data } = await axios.post<CanteenOrder>(
    `${ipNR}/canteen/kitchen/next`,
    {},
    getAuthHeader(token),
  );
  return data;
}

export async function setKitchenOrderCooking(
  token: string,
  orderId: string,
) {
  const { data } = await axios.patch<CanteenOrder>(
    `${ipNR}/canteen/kitchen/orders/${encodeURIComponent(orderId)}/cooking`,
    {},
    getAuthHeader(token),
  );
  return data;
}

export async function setKitchenOrderReady(token: string, orderId: string) {
  const { data } = await axios.patch<CanteenOrder>(
    `${ipNR}/canteen/kitchen/orders/${encodeURIComponent(orderId)}/ready`,
    {},
    getAuthHeader(token),
  );
  return data;
}
