import { useAuthSession } from "@/src/features/auth/model/AuthSessionContext";
import AdminCanteenAnalytics from "@/src/features/canteen/admin/ui/AdminCanteenAnalytics";
import AdminCategoryManager from "@/src/features/canteen/admin/ui/AdminCategoryManager";
import AdminInventoryManager from "@/src/features/canteen/admin/ui/AdminInventoryManager";
import AdminMenuCatalog from "@/src/features/canteen/admin/ui/AdminMenuCatalog";
import AdminTableManager from "@/src/features/canteen/admin/ui/AdminTableManager";
import { getCanteenErrorMessage } from "@/src/features/canteen/shared/model/presentation";
import AdminOrderSummaryCard from "@/src/features/canteen/admin/ui/AdminOrderSummaryCard";
import {
  cancelCanteenOrder,
  completeCanteenOrder,
  confirmCanteenOrder,
  getKitchenQueue,
  getNextKitchenOrder,
  listCanteenOrders,
  setKitchenOrderCooking,
  setKitchenOrderReady,
} from "@/src/services/canteen/canteen.service";
import {
  ORDER_PAYMENT_STATUS_LABELS,
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  type CanteenOrder,
  type OrderPaymentStatus,
  type OrderStatus,
} from "@/src/services/canteen/constant";
import { normalizeAppRole } from "@/src/services/user/constant";
import { AppAlert as Alert } from "@/src/shared/ui/AppAlert";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

type OperationsTab =
  | "orders"
  | "kitchen"
  | "catalog"
  | "categories"
  | "tables"
  | "inventory"
  | "analytics";
type StatusFilter = OrderStatus | "ALL";
type PaymentFilter = OrderPaymentStatus | "ALL";
type OrderAction = "confirm" | "complete" | "cancel";

const OPERATOR_ROLES = ["admin", "manager", "cashier", "waiter"];
const KITCHEN_ROLES = ["admin", "manager", "chef"];
const CATALOG_ROLES = ["admin", "manager"];
const TABLE_ROLES = ["admin", "manager", "waiter"];
const INVENTORY_ROLES = ["admin", "manager", "chef"];

export default function AdminCanteenScreen() {
  const { user, getToken } = useAuthSession();
  const role = normalizeAppRole(user?.role);
  const canOperateOrders = OPERATOR_ROLES.includes(role);
  const canUseKitchen = KITCHEN_ROLES.includes(role);
  const canManageCatalog = CATALOG_ROLES.includes(role);
  const canUseTables = TABLE_ROLES.includes(role);
  const canUseInventory = INVENTORY_ROLES.includes(role);

  const [tab, setTab] = useState<OperationsTab>("orders");
  const [resourceRefreshKey, setResourceRefreshKey] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("ALL");
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState<CanteenOrder[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [cancelReasons, setCancelReasons] = useState<Record<string, string>>({});

  const [queue, setQueue] = useState<CanteenOrder[]>([]);
  const [cookingOrders, setCookingOrders] = useState<CanteenOrder[]>([]);
  const [kitchenLoading, setKitchenLoading] = useState(true);

  const loadOrders = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) setOrdersLoading(true);
        const token = await getToken();
        if (!token) return;
        const result = await listCanteenOrders(token, {
          page,
          limit: 20,
          status: statusFilter === "ALL" ? undefined : statusFilter,
          paymentStatus:
            paymentFilter === "ALL" ? undefined : paymentFilter,
        });
        setOrders(Array.isArray(result.orders) ? result.orders : []);
        setTotalPages(Math.max(result.pagination?.totalPages || 1, 1));
        setTotalOrders(result.pagination?.total || 0);
      } catch (error) {
        Alert.alert(
          "Lỗi",
          getCanteenErrorMessage(error, "Không tải được danh sách đơn hàng"),
        );
      } finally {
        if (showLoading) setOrdersLoading(false);
      }
    },
    [getToken, page, paymentFilter, statusFilter],
  );

  const loadKitchen = useCallback(
    async (showLoading = true) => {
      if (!canUseKitchen) {
        setQueue([]);
        setCookingOrders([]);
        setKitchenLoading(false);
        return;
      }
      try {
        if (showLoading) setKitchenLoading(true);
        const token = await getToken();
        if (!token) return;
        const [confirmed, cooking] = await Promise.all([
          getKitchenQueue(token),
          listCanteenOrders(token, {
            status: "COOKING",
            page: 1,
            limit: 100,
          }),
        ]);
        setQueue(confirmed);
        setCookingOrders(Array.isArray(cooking.orders) ? cooking.orders : []);
      } catch (error) {
        Alert.alert(
          "Lỗi",
          getCanteenErrorMessage(error, "Không tải được hàng đợi nhà bếp"),
        );
      } finally {
        if (showLoading) setKitchenLoading(false);
      }
    },
    [canUseKitchen, getToken],
  );

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    void loadKitchen();
  }, [loadKitchen]);

  const runOrderAction = async (
    action: OrderAction,
    order: CanteenOrder,
  ) => {
    const key = `${action}:${order._id}`;
    try {
      setActionKey(key);
      const token = await getToken();
      if (!token) return;
      if (action === "confirm") {
        await confirmCanteenOrder(token, order._id);
      } else if (action === "complete") {
        await completeCanteenOrder(token, order._id);
      } else {
        await cancelCanteenOrder(token, order._id, cancelReasons[order._id]);
      }
      await Promise.all([loadOrders(false), loadKitchen(false)]);
      Alert.alert("Thành công", `Đã cập nhật đơn ${order.orderNumber}`);
    } catch (error) {
      Alert.alert(
        "Lỗi",
        getCanteenErrorMessage(error, "Không cập nhật được đơn hàng"),
      );
    } finally {
      setActionKey(null);
    }
  };

  const confirmCancel = (order: CanteenOrder) => {
    Alert.alert(
      "Xác nhận hủy đơn",
      `Hủy đơn ${order.orderNumber}? Thao tác này không thể hoàn tác.`,
      [
        { text: "Không", style: "cancel" },
        {
          text: "Hủy đơn",
          style: "destructive",
          onPress: () => runOrderAction("cancel", order),
        },
      ],
    );
  };

  const runKitchenAction = async (
    action: "next" | "cooking" | "ready",
    order?: CanteenOrder,
  ) => {
    const key = `${action}:${order?._id ?? "next"}`;
    try {
      setActionKey(key);
      const token = await getToken();
      if (!token) return;
      if (action === "next") {
        const claimed = await getNextKitchenOrder(token);
        Alert.alert("Đã nhận đơn", `Bắt đầu chế biến ${claimed.orderNumber}`);
      } else if (action === "cooking" && order) {
        await setKitchenOrderCooking(token, order._id);
      } else if (action === "ready" && order) {
        await setKitchenOrderReady(token, order._id);
      }
      await Promise.all([loadKitchen(false), loadOrders(false)]);
    } catch (error) {
      Alert.alert(
        "Lỗi",
        getCanteenErrorMessage(
          error,
          "Không cập nhật được hàng đợi nhà bếp",
        ),
      );
    } finally {
      setActionKey(null);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (tab === "orders") await loadOrders(false);
    else if (tab === "kitchen") await loadKitchen(false);
    else setResourceRefreshKey((current) => current + 1);
    setRefreshing(false);
  };

  const operationTabs: { value: OperationsTab; label: string }[] = [
    { value: "orders", label: "Đơn hàng" },
    { value: "kitchen", label: "Nhà bếp" },
  ];
  if (canManageCatalog) {
    operationTabs.push({ value: "catalog", label: "Thực đơn" });
    operationTabs.push({ value: "categories", label: "Danh mục" });
  }
  if (canUseTables) {
    operationTabs.push({ value: "tables", label: "Bàn ăn" });
  }
  if (canUseInventory) {
    operationTabs.push({ value: "inventory", label: "Kho" });
  }
  if (canManageCatalog) {
    operationTabs.push({ value: "analytics", label: "Thống kê" });
  }

  const renderOrderActions = (order: CanteenOrder) => {
    if (!canOperateOrders) {
      return (
        <Text className="text-center text-xs font-semibold text-slate-400">
          Vai trò của bạn chỉ được theo dõi đơn hàng.
        </Text>
      );
    }

    const canConfirm =
      order.status === "CREATED" &&
      (order.paymentMethod !== "VIETQR" || order.paymentStatus === "PAID");
    const canComplete = order.status === "READY";
    const canCancel =
      order.paymentStatus !== "PAID" &&
      (order.status === "CREATED" || order.status === "CONFIRMED");
    const waitingForVietQr =
      order.status === "CREATED" &&
      order.paymentMethod === "VIETQR" &&
      order.paymentStatus !== "PAID";
    if (!canConfirm && !canComplete && !canCancel && !waitingForVietQr) {
      return null;
    }

    return (
      <View>
        {waitingForVietQr ? (
          <Text className="mb-2 text-center text-xs font-bold text-amber-600">
            Chờ VietQR báo thanh toán trước khi xác nhận đơn.
          </Text>
        ) : null}
        {canCancel ? (
          <TextInput
            className="mb-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-700"
            maxLength={500}
            onChangeText={(reason) =>
              setCancelReasons((current) => ({
                ...current,
                [order._id]: reason,
              }))
            }
            placeholder="Lý do hủy (không bắt buộc)"
            placeholderTextColor="#94a3b8"
            value={cancelReasons[order._id] ?? ""}
          />
        ) : null}
        <View className="flex-row">
          {canConfirm ? (
            <Pressable
              className="mr-2 flex-1 items-center rounded-2xl bg-blue-600 py-3 disabled:opacity-50"
              disabled={actionKey === `confirm:${order._id}`}
              onPress={() => runOrderAction("confirm", order)}
            >
              {actionKey === `confirm:${order._id}` ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className="text-xs font-black text-white">Xác nhận</Text>
              )}
            </Pressable>
          ) : null}
          {canComplete ? (
            <Pressable
              className="mr-2 flex-1 items-center rounded-2xl bg-emerald-600 py-3 disabled:opacity-50"
              disabled={actionKey === `complete:${order._id}`}
              onPress={() => runOrderAction("complete", order)}
            >
              {actionKey === `complete:${order._id}` ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className="text-xs font-black text-white">Hoàn tất</Text>
              )}
            </Pressable>
          ) : null}
          {canCancel ? (
            <Pressable
              className="flex-1 items-center rounded-2xl border border-rose-200 bg-rose-50 py-3 disabled:opacity-50"
              disabled={actionKey === `cancel:${order._id}`}
              onPress={() => confirmCancel(order)}
            >
              {actionKey === `cancel:${order._id}` ? (
                <ActivityIndicator color="#e11d48" size="small" />
              ) : (
                <Text className="text-xs font-black text-rose-600">Hủy đơn</Text>
              )}
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-slate-50">
      <View className="border-b border-slate-100 bg-white px-4 pb-3 pt-4">
        <View className="flex-row items-center">
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-orange-50">
            <Ionicons name="storefront" size={23} color="#ea580c" />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-xl font-black text-slate-900">
              Vận hành căn tin
            </Text>
            <Text className="text-xs font-semibold text-slate-400">
              Quản lý đơn, nhà bếp và tài nguyên căn tin
            </Text>
          </View>
        </View>

        <ScrollView
          className="-mx-4 mt-4"
          contentContainerStyle={{ paddingHorizontal: 16 }}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          <View className="flex-row rounded-2xl bg-slate-100 p-1">
            {operationTabs.map(({ value, label }) => (
              <Pressable
                key={value}
                className={`items-center rounded-xl px-4 py-2.5 ${
                  tab === value ? "bg-white shadow-sm" : ""
                }`}
                onPress={() => setTab(value)}
              >
                <Text
                  className={`text-xs font-black ${
                    tab === value ? "text-orange-600" : "text-slate-500"
                  }`}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 36 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {tab === "orders" ? (
          <>
            <Text className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Trạng thái đơn
            </Text>
            <ScrollView
              className="-mx-4 mb-3"
              contentContainerStyle={{ paddingHorizontal: 16 }}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {(["ALL", ...ORDER_STATUSES] as StatusFilter[]).map((status) => (
                <Pressable
                  key={status}
                  className={`mr-2 rounded-full border px-3 py-2 ${
                    statusFilter === status
                      ? "border-orange-500 bg-orange-50"
                      : "border-slate-200 bg-white"
                  }`}
                  onPress={() => {
                    setPage(1);
                    setStatusFilter(status);
                  }}
                >
                  <Text
                    className={`text-xs font-bold ${
                      statusFilter === status
                        ? "text-orange-600"
                        : "text-slate-500"
                    }`}
                  >
                    {status === "ALL" ? "Tất cả" : ORDER_STATUS_LABELS[status]}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Thanh toán
            </Text>
            <View className="mb-4 flex-row flex-wrap">
              {(
                ["ALL", "PENDING", "PAID", "REFUNDED"] as PaymentFilter[]
              ).map((status) => (
                <Pressable
                  key={status}
                  className={`mb-2 mr-2 rounded-full border px-3 py-2 ${
                    paymentFilter === status
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 bg-white"
                  }`}
                  onPress={() => {
                    setPage(1);
                    setPaymentFilter(status);
                  }}
                >
                  <Text
                    className={`text-xs font-bold ${
                      paymentFilter === status
                        ? "text-blue-600"
                        : "text-slate-500"
                    }`}
                  >
                    {status === "ALL"
                      ? "Tất cả"
                      : ORDER_PAYMENT_STATUS_LABELS[status]}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-sm font-black text-slate-700">
                {totalOrders} đơn hàng
              </Text>
              <Text className="text-xs font-semibold text-slate-400">
                Trang {page}/{totalPages}
              </Text>
            </View>

            {ordersLoading ? (
              <View className="items-center py-20">
                <ActivityIndicator size="large" color="#ea580c" />
              </View>
            ) : orders.length === 0 ? (
              <View className="items-center rounded-3xl bg-white py-14">
                <Ionicons name="receipt-outline" size={42} color="#cbd5e1" />
                <Text className="mt-3 text-sm font-semibold text-slate-400">
                  Không có đơn phù hợp bộ lọc
                </Text>
              </View>
            ) : (
              orders.map((order) => (
                <AdminOrderSummaryCard
                  footer={renderOrderActions(order)}
                  key={order._id}
                  order={order}
                  showOwner
                />
              ))
            )}

            {totalPages > 1 ? (
              <View className="mt-2 flex-row">
                <Pressable
                  className="mr-2 flex-1 items-center rounded-2xl border border-slate-200 bg-white py-3 disabled:opacity-40"
                  disabled={page <= 1}
                  onPress={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <Text className="text-xs font-black text-slate-600">Trang trước</Text>
                </Pressable>
                <Pressable
                  className="flex-1 items-center rounded-2xl bg-slate-800 py-3 disabled:opacity-40"
                  disabled={page >= totalPages}
                  onPress={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                >
                  <Text className="text-xs font-black text-white">Trang sau</Text>
                </Pressable>
              </View>
            ) : null}
          </>
        ) : tab === "catalog" && canManageCatalog ? (
          <AdminMenuCatalog refreshKey={resourceRefreshKey} />
        ) : tab === "categories" && canManageCatalog ? (
          <AdminCategoryManager refreshKey={resourceRefreshKey} />
        ) : tab === "tables" && canUseTables ? (
          <AdminTableManager
            canManageStructure={canManageCatalog}
            refreshKey={resourceRefreshKey}
          />
        ) : tab === "inventory" && canUseInventory ? (
          <AdminInventoryManager
            canManageResources={canManageCatalog}
            refreshKey={resourceRefreshKey}
          />
        ) : tab === "analytics" && canManageCatalog ? (
          <AdminCanteenAnalytics refreshKey={resourceRefreshKey} />
        ) : !canUseKitchen ? (
          <View className="items-center rounded-3xl border border-slate-100 bg-white px-6 py-14">
            <Ionicons name="lock-closed-outline" size={42} color="#94a3b8" />
            <Text className="mt-3 text-center text-base font-black text-slate-700">
              Không có quyền vào nhà bếp
            </Text>
            <Text className="mt-2 text-center text-xs leading-5 text-slate-400">
              Chức năng này dành cho quản trị viên, quản lý và đầu bếp.
            </Text>
          </View>
        ) : kitchenLoading ? (
          <View className="items-center py-20">
            <ActivityIndicator size="large" color="#ea580c" />
          </View>
        ) : (
          <>
            <View className="mb-4 rounded-3xl bg-slate-900 p-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                  <Text className="text-base font-black text-white">
                    Nhận đơn ưu tiên tiếp theo
                  </Text>
                  <Text className="mt-1 text-xs leading-5 text-slate-400">
                    Hệ thống lấy nguyên tử đơn ưu tiên cao nhất và chuyển sang đang nấu.
                  </Text>
                </View>
                <Pressable
                  className="h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 disabled:opacity-50"
                  disabled={actionKey === "next:next" || queue.length === 0}
                  onPress={() => runKitchenAction("next")}
                >
                  {actionKey === "next:next" ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Ionicons name="play" size={22} color="white" />
                  )}
                </Pressable>
              </View>
            </View>

            <Text className="mb-3 text-base font-black text-slate-800">
              Chờ chế biến ({queue.length})
            </Text>
            {queue.length === 0 ? (
              <View className="mb-5 rounded-3xl bg-white p-5">
                <Text className="text-center text-xs font-semibold text-slate-400">
                  Không có đơn đang chờ
                </Text>
              </View>
            ) : (
              queue.map((order) => (
                <AdminOrderSummaryCard
                  key={order._id}
                  order={order}
                  showOwner
                  footer={
                    <View>
                      <Text className="mb-2 text-xs font-bold text-orange-600">
                        Điểm ưu tiên: {order.priorityScore}
                      </Text>
                      <Pressable
                        className="items-center rounded-2xl bg-orange-500 py-3 disabled:opacity-50"
                        disabled={actionKey === `cooking:${order._id}`}
                        onPress={() => runKitchenAction("cooking", order)}
                      >
                        {actionKey === `cooking:${order._id}` ? (
                          <ActivityIndicator color="white" size="small" />
                        ) : (
                          <Text className="text-xs font-black text-white">
                            Bắt đầu nấu
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  }
                />
              ))
            )}

            <Text className="mb-3 mt-2 text-base font-black text-slate-800">
              Đang chế biến ({cookingOrders.length})
            </Text>
            {cookingOrders.length === 0 ? (
              <View className="rounded-3xl bg-white p-5">
                <Text className="text-center text-xs font-semibold text-slate-400">
                  Chưa có đơn đang nấu
                </Text>
              </View>
            ) : (
              cookingOrders.map((order) => (
                <AdminOrderSummaryCard
                  key={order._id}
                  order={order}
                  showOwner
                  footer={
                    <Pressable
                      className="items-center rounded-2xl bg-emerald-600 py-3 disabled:opacity-50"
                      disabled={actionKey === `ready:${order._id}`}
                      onPress={() => runKitchenAction("ready", order)}
                    >
                      {actionKey === `ready:${order._id}` ? (
                        <ActivityIndicator color="white" size="small" />
                      ) : (
                        <Text className="text-xs font-black text-white">
                          Đánh dấu sẵn sàng
                        </Text>
                      )}
                    </Pressable>
                  }
                />
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
