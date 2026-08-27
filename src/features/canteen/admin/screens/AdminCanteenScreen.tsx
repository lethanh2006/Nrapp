import { useAuthSession } from "@/src/features/auth/model/AuthSessionContext";
import AdminCanteenAnalytics from "@/src/features/canteen/admin/ui/AdminCanteenAnalytics";
import AdminCategoryManager from "@/src/features/canteen/admin/ui/AdminCategoryManager";
import AdminInventoryManager from "@/src/features/canteen/admin/ui/AdminInventoryManager";
import AdminMenuCatalog from "@/src/features/canteen/admin/ui/AdminMenuCatalog";
import AdminOrderFilters from "@/src/features/canteen/admin/ui/AdminOrderFilters";
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
  type CanteenOrder,
  type OrderPaymentStatus,
  type OrderStatus,
} from "@/src/services/canteen/constant";
import { getRoleLabel } from "@/src/application/access/roles";
import { normalizeAppRole } from "@/src/services/user/constant";
import { AppAlert as Alert } from "@/src/shared/ui/AppAlert";
import { Ionicons } from "@expo/vector-icons";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from "react";
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
type IoniconName = ComponentProps<typeof Ionicons>["name"];

type OperationTabItem = {
  value: OperationsTab;
  label: string;
  description: string;
  icon: IoniconName;
};

const OPERATOR_ROLES = ["admin", "manager", "cashier", "waiter"];
const KITCHEN_ROLES = ["admin", "manager", "chef"];
const CATALOG_ROLES = ["admin", "manager"];
const TABLE_ROLES = ["admin", "manager", "waiter"];
const INVENTORY_ROLES = ["admin", "manager", "chef"];

const OPERATION_TAB_ITEMS: OperationTabItem[] = [
  {
    value: "orders",
    label: "Đơn hàng",
    description: "Duyệt, giao món và xử lý thanh toán",
    icon: "receipt-outline",
  },
  {
    value: "kitchen",
    label: "Nhà bếp",
    description: "Điều phối hàng đợi và tiến độ chế biến",
    icon: "flame-outline",
  },
  {
    value: "catalog",
    label: "Thực đơn",
    description: "Cập nhật món, giá và trạng thái mở bán",
    icon: "restaurant-outline",
  },
  {
    value: "categories",
    label: "Danh mục",
    description: "Sắp xếp nhóm món hiển thị trên thực đơn",
    icon: "albums-outline",
  },
  {
    value: "tables",
    label: "Bàn ăn",
    description: "Cấp bàn và theo dõi trạng thái phục vụ",
    icon: "grid-outline",
  },
  {
    value: "inventory",
    label: "Kho",
    description: "Nhập lô, xuất dùng và theo dõi hạn sử dụng",
    icon: "cube-outline",
  },
  {
    value: "analytics",
    label: "Thống kê",
    description: "Theo dõi các món được đặt nhiều nhất",
    icon: "stats-chart-outline",
  },
];

function LoadErrorCard({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View className="items-center rounded-3xl border border-rose-100 bg-white px-5 py-10">
      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-rose-50">
        <Ionicons name="cloud-offline-outline" size={24} color="#e11d48" />
      </View>
      <Text className="mt-3 text-center text-sm font-black text-slate-800">
        Chưa tải được dữ liệu
      </Text>
      <Text className="mt-1 text-center text-xs leading-5 text-slate-500">
        {message}
      </Text>
      <Pressable
        accessibilityLabel="Thử tải lại dữ liệu"
        accessibilityRole="button"
        className="mt-4 flex-row items-center rounded-2xl bg-red-600 px-4 py-3 active:bg-red-700"
        onPress={onRetry}
      >
        <Ionicons name="refresh" size={16} color="white" />
        <Text className="ml-2 text-xs font-black text-white">Thử lại</Text>
      </Pressable>
    </View>
  );
}

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
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [cancelReasons, setCancelReasons] = useState<Record<string, string>>({});
  const actionLock = useRef(false);
  const ordersRequestId = useRef(0);

  const [queue, setQueue] = useState<CanteenOrder[]>([]);
  const [cookingOrders, setCookingOrders] = useState<CanteenOrder[]>([]);
  const [kitchenLoading, setKitchenLoading] = useState(true);
  const [kitchenError, setKitchenError] = useState<string | null>(null);
  const kitchenRequestId = useRef(0);

  const loadOrders = useCallback(
    async (showLoading = true) => {
      const requestId = ++ordersRequestId.current;
      try {
        if (showLoading) setOrdersLoading(true);
        const token = await getToken();
        if (!token) {
          if (requestId === ordersRequestId.current) {
            setOrdersError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
          }
          return;
        }
        const result = await listCanteenOrders(token, {
          page,
          limit: 20,
          status: statusFilter === "ALL" ? undefined : statusFilter,
          paymentStatus:
            paymentFilter === "ALL" ? undefined : paymentFilter,
        });
        if (requestId !== ordersRequestId.current) return;

        const nextTotalPages = Math.max(result.pagination?.totalPages || 1, 1);
        if (page > nextTotalPages) {
          setPage(nextTotalPages);
          return;
        }
        setOrders(Array.isArray(result.orders) ? result.orders : []);
        setTotalPages(nextTotalPages);
        setTotalOrders(result.pagination?.total || 0);
        setOrdersError(null);
      } catch (error) {
        if (requestId === ordersRequestId.current) {
          setOrdersError(
            getCanteenErrorMessage(error, "Không tải được danh sách đơn hàng"),
          );
        }
      } finally {
        if (showLoading && requestId === ordersRequestId.current) {
          setOrdersLoading(false);
        }
      }
    },
    [getToken, page, paymentFilter, statusFilter],
  );

  const loadKitchen = useCallback(
    async (showLoading = true) => {
      const requestId = ++kitchenRequestId.current;
      if (!canUseKitchen) {
        setQueue([]);
        setCookingOrders([]);
        setKitchenError(null);
        setKitchenLoading(false);
        return;
      }
      try {
        if (showLoading) setKitchenLoading(true);
        const token = await getToken();
        if (!token) {
          if (requestId === kitchenRequestId.current) {
            setKitchenError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
          }
          return;
        }
        const [confirmed, cooking] = await Promise.all([
          getKitchenQueue(token),
          listCanteenOrders(token, {
            status: "COOKING",
            page: 1,
            limit: 100,
          }),
        ]);
        if (requestId !== kitchenRequestId.current) return;
        setQueue(confirmed);
        setCookingOrders(Array.isArray(cooking.orders) ? cooking.orders : []);
        setKitchenError(null);
      } catch (error) {
        if (requestId === kitchenRequestId.current) {
          setKitchenError(
            getCanteenErrorMessage(error, "Không tải được hàng đợi nhà bếp"),
          );
        }
      } finally {
        if (showLoading && requestId === kitchenRequestId.current) {
          setKitchenLoading(false);
        }
      }
    },
    [canUseKitchen, getToken],
  );

  useEffect(() => {
    if (tab === "orders") void loadOrders();
  }, [loadOrders, tab]);

  useEffect(() => {
    if (tab === "kitchen") void loadKitchen();
  }, [loadKitchen, tab]);

  const runOrderAction = async (
    action: OrderAction,
    order: CanteenOrder,
  ) => {
    if (actionLock.current) return;
    actionLock.current = true;
    const key = `${action}:${order._id}`;
    try {
      setActionKey(key);
      const token = await getToken();
      if (!token) {
        Alert.alert("Lỗi", "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        return;
      }
      if (action === "confirm") {
        await confirmCanteenOrder(token, order._id);
      } else if (action === "complete") {
        await completeCanteenOrder(token, order._id);
      } else {
        await cancelCanteenOrder(token, order._id, cancelReasons[order._id]);
      }
      await loadOrders(false);
      if (action === "cancel") {
        setCancelReasons((current) => {
          const next = { ...current };
          delete next[order._id];
          return next;
        });
      }
      Alert.alert("Thành công", `Đã cập nhật đơn ${order.orderNumber}`);
    } catch (error) {
      Alert.alert(
        "Lỗi",
        getCanteenErrorMessage(error, "Không cập nhật được đơn hàng"),
      );
      void loadOrders(false);
    } finally {
      actionLock.current = false;
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
    if (actionLock.current) return;
    actionLock.current = true;
    const key = `${action}:${order?._id ?? "next"}`;
    try {
      setActionKey(key);
      const token = await getToken();
      if (!token) {
        Alert.alert("Lỗi", "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        return;
      }
      if (action === "next") {
        const claimed = await getNextKitchenOrder(token);
        Alert.alert("Đã nhận đơn", `Bắt đầu chế biến ${claimed.orderNumber}`);
      } else if (action === "cooking" && order) {
        await setKitchenOrderCooking(token, order._id);
      } else if (action === "ready" && order) {
        await setKitchenOrderReady(token, order._id);
      }
      await loadKitchen(false);
    } catch (error) {
      Alert.alert(
        "Lỗi",
        getCanteenErrorMessage(
          error,
          "Không cập nhật được hàng đợi nhà bếp",
        ),
      );
      void loadKitchen(false);
    } finally {
      actionLock.current = false;
      setActionKey(null);
    }
  };

  const onRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      if (tab === "orders") await loadOrders(false);
      else if (tab === "kitchen") await loadKitchen(false);
      else setResourceRefreshKey((current) => current + 1);
    } finally {
      setRefreshing(false);
    }
  };

  const operationTabs = useMemo(
    () =>
      OPERATION_TAB_ITEMS.filter(({ value }) => {
        if (value === "kitchen") return canUseKitchen;
        if (value === "catalog" || value === "categories" || value === "analytics") {
          return canManageCatalog;
        }
        if (value === "tables") return canUseTables;
        if (value === "inventory") return canUseInventory;
        return true;
      }),
    [canManageCatalog, canUseInventory, canUseKitchen, canUseTables],
  );

  const activeTab =
    operationTabs.find((item) => item.value === tab) ??
    OPERATION_TAB_ITEMS[0];

  useEffect(() => {
    if (!operationTabs.some((item) => item.value === tab)) {
      setTab("orders");
    }
  }, [operationTabs, tab]);

  const pageStats = useMemo(
    () => ({
      newOrders: orders.filter((order) => order.status === "CREATED").length,
      inKitchen: orders.filter(
        (order) => order.status === "CONFIRMED" || order.status === "COOKING",
      ).length,
      ready: orders.filter((order) => order.status === "READY").length,
    }),
    [orders],
  );

  const hasOrderFilters = statusFilter !== "ALL" || paymentFilter !== "ALL";

  const applyOrderFilters = (
    status: StatusFilter,
    payment: PaymentFilter,
  ) => {
    setPage(1);
    setStatusFilter(status);
    setPaymentFilter(payment);
  };

  const resetOrderFilters = () => applyOrderFilters("ALL", "ALL");

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
      (order.paymentMethod === "CASH" || order.paymentStatus === "PAID");
    const canComplete = order.status === "READY";
    const canCancel =
      order.paymentStatus !== "PAID" &&
      (order.status === "CREATED" || order.status === "CONFIRMED");
    const waitingForElectronicPayment =
      order.status === "CREATED" &&
      order.paymentMethod !== "CASH" &&
      order.paymentStatus !== "PAID";
    if (
      !canConfirm &&
      !canComplete &&
      !canCancel &&
      !waitingForElectronicPayment
    ) {
      return null;
    }

    return (
      <View>
        {waitingForElectronicPayment ? (
          <Text className="mb-2 text-center text-xs font-bold text-amber-600">
            Chờ hệ thống ghi nhận thanh toán điện tử trước khi xác nhận đơn.
          </Text>
        ) : null}
        {canCancel ? (
          <TextInput
            className="mb-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-700"
            editable={actionKey === null}
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
              className="mr-2 flex-1 items-center rounded-2xl bg-red-600 py-3 disabled:opacity-50"
              disabled={actionKey !== null}
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
              disabled={actionKey !== null}
              onPress={() => runOrderAction("complete", order)}
            >
              {actionKey === `complete:${order._id}` ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className="text-xs font-black text-white">
                  {order.paymentMethod === "CASH" &&
                  order.paymentStatus === "PENDING" &&
                  order.finalAmount > 0
                    ? "Giao món & thu tiền"
                    : "Giao món & hoàn tất"}
                </Text>
              )}
            </Pressable>
          ) : null}
          {canCancel ? (
            <Pressable
              className="flex-1 items-center rounded-2xl border border-rose-200 bg-rose-50 py-3 disabled:opacity-50"
              disabled={actionKey !== null}
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
      <View
        className="overflow-hidden border-b border-red-800 bg-red-900 px-4 pb-5 pt-4 shadow-sm"
        style={{ elevation: 3 }}
      >
        <View className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-red-500/20" />
        <View className="absolute -bottom-16 left-8 h-32 w-32 rounded-full bg-white/5" />
        <View className="flex-row items-center">
          <View
            className="h-12 w-12 items-center justify-center rounded-2xl bg-red-600 shadow-sm"
            style={{ elevation: 2 }}
          >
            <Ionicons name="storefront" size={24} color="white" />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-[10px] font-black uppercase tracking-[2px] text-red-200">
              Khu vực quản lý
            </Text>
            <Text className="mt-0.5 text-xl font-black text-white">
              Vận hành căn tin
            </Text>
          </View>
          <View className="items-center rounded-2xl border border-white/15 bg-white/10 px-3 py-2">
            <Ionicons name="person-circle-outline" size={20} color="#fecaca" />
            <Text className="mt-1 text-[9px] font-bold text-red-100">
              {getRoleLabel(user?.role)}
            </Text>
          </View>
        </View>
        <View className="mt-4 flex-row items-start">
          <View className="mr-2 mt-1.5 h-2 w-2 rounded-full bg-red-300" />
          <View className="flex-1">
            <Text className="text-sm font-black text-white">
              {activeTab.label}
            </Text>
            <Text className="mt-1 text-xs leading-5 text-red-100/70">
              {activeTab.description}
            </Text>
          </View>
        </View>
      </View>

      <View className="border-b border-slate-100 bg-slate-50 pb-3 pt-3">
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16 }}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          <View className="flex-row" style={{ gap: 8 }}>
            {/* Keep the shadow static: conditional NativeWind shadows can
                trigger a misleading React Navigation context error in dev. */}
            {operationTabs.map(({ value, label, icon }) => {
              const selected = tab === value;
              const badge =
                value === "orders"
                  ? pageStats.newOrders + pageStats.ready
                  : value === "kitchen"
                    ? queue.length + cookingOrders.length
                    : 0;
              return (
                <Pressable
                  accessibilityLabel={`Mở mục ${label}`}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  key={value}
                  className={`min-w-[88px] items-center rounded-2xl border px-3 py-2.5 shadow-sm active:opacity-80 ${
                    selected
                      ? "border-red-600 bg-red-600"
                      : "border-slate-100 bg-white"
                  }`}
                  onPress={() => setTab(value)}
                  style={{ elevation: 1 }}
                >
                  <Ionicons
                    color={selected ? "white" : "#64748b"}
                    name={icon}
                    size={18}
                  />
                  <Text
                    className={`mt-1 text-[10px] font-black ${
                      selected ? "text-white" : "text-slate-600"
                    }`}
                  >
                    {label}
                  </Text>
                  {badge > 0 ? (
                    <View className="absolute right-1.5 top-1.5 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 py-0.5">
                      <Text className="text-[8px] font-black text-white">
                        {badge > 99 ? "99+" : badge}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
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
            <View className="mb-4 flex-row" style={{ gap: 8 }}>
              <View
                className="flex-1 overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 shadow-sm"
                style={{ elevation: 2 }}
              >
                <View className="absolute left-0 top-0 h-full w-1 bg-blue-500" />
                <Ionicons name="sparkles-outline" size={17} color="#2563eb" />
                <Text className="mt-2 text-[9px] font-black uppercase text-slate-500">
                  Mới trên trang
                </Text>
                <Text className="mt-1 text-2xl font-black text-blue-700">
                  {pageStats.newOrders}
                </Text>
              </View>
              <View
                className="flex-1 overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 shadow-sm"
                style={{ elevation: 2 }}
              >
                <View className="absolute left-0 top-0 h-full w-1 bg-red-500" />
                <Ionicons name="flame-outline" size={17} color="#dc2626" />
                <Text className="mt-2 text-[9px] font-black uppercase text-slate-500">
                  Trong bếp
                </Text>
                <Text className="mt-1 text-2xl font-black text-red-600">
                  {pageStats.inKitchen}
                </Text>
              </View>
              <View
                className="flex-1 overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 shadow-sm"
                style={{ elevation: 2 }}
              >
                <View className="absolute left-0 top-0 h-full w-1 bg-emerald-500" />
                <Ionicons name="checkmark-circle-outline" size={17} color="#059669" />
                <Text className="mt-2 text-[9px] font-black uppercase text-slate-500">
                  Chờ giao
                </Text>
                <Text className="mt-1 text-2xl font-black text-emerald-700">
                  {pageStats.ready}
                </Text>
              </View>
            </View>

            <AdminOrderFilters
              onApply={applyOrderFilters}
              page={page}
              paymentFilter={paymentFilter}
              statusFilter={statusFilter}
              totalOrders={totalOrders}
              totalPages={totalPages}
            />

            {ordersLoading ? (
              <View className="items-center py-20">
                <ActivityIndicator size="large" color="#dc2626" />
                <Text className="mt-3 text-xs font-semibold text-slate-400">
                  Đang tải đơn hàng…
                </Text>
              </View>
            ) : ordersError ? (
              <LoadErrorCard
                message={ordersError}
                onRetry={() => void loadOrders()}
              />
            ) : orders.length === 0 ? (
              <View className="items-center rounded-3xl border border-slate-100 bg-white px-5 py-14">
                <Ionicons name="receipt-outline" size={42} color="#cbd5e1" />
                <Text className="mt-3 text-sm font-black text-slate-700">
                  Không có đơn phù hợp bộ lọc
                </Text>
                {hasOrderFilters ? (
                  <Pressable
                    className="mt-4 rounded-2xl bg-red-600 px-4 py-3 active:bg-red-700"
                    onPress={resetOrderFilters}
                  >
                    <Text className="text-xs font-black text-white">
                      Xem tất cả đơn
                    </Text>
                  </Pressable>
                ) : null}
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

            {!ordersLoading && !ordersError && totalPages > 1 ? (
              <View className="mt-2 flex-row">
                <Pressable
                  accessibilityLabel="Mở trang đơn hàng trước"
                  className="mr-2 flex-1 items-center rounded-2xl border border-slate-200 bg-white py-3 disabled:opacity-40"
                  disabled={page <= 1}
                  onPress={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <Text className="text-xs font-black text-slate-600">Trang trước</Text>
                </Pressable>
                <Pressable
                  accessibilityLabel="Mở trang đơn hàng sau"
                  className="flex-1 items-center rounded-2xl bg-red-700 py-3 disabled:opacity-40"
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
            <ActivityIndicator size="large" color="#dc2626" />
            <Text className="mt-3 text-xs font-semibold text-slate-400">
              Đang tải hàng đợi nhà bếp…
            </Text>
          </View>
        ) : kitchenError ? (
          <LoadErrorCard
            message={kitchenError}
            onRetry={() => void loadKitchen()}
          />
        ) : (
          <>
            <View
              className="mb-4 overflow-hidden rounded-3xl border border-red-100 bg-white p-4 shadow-sm"
              style={{ elevation: 2 }}
            >
              <View className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-red-50" />
              <View className="absolute -bottom-12 -left-8 h-24 w-24 rounded-full bg-blue-50" />
              <View className="flex-row items-start">
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-red-600">
                  <Ionicons name="flame" size={22} color="white" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-base font-black text-slate-900">
                    Điều phối chế biến
                  </Text>
                  <Text className="mt-1 text-xs leading-5 text-slate-500">
                    Tự động chọn đơn có điểm ưu tiên cao nhất và chuyển sang đang nấu.
                  </Text>
                </View>
              </View>

              <View className="mt-4 flex-row" style={{ gap: 8 }}>
                <View className="flex-1 rounded-2xl border border-red-100 bg-red-50 p-3">
                  <Text className="text-[9px] font-black uppercase text-red-600">
                    Đang chờ
                  </Text>
                  <Text className="mt-1 text-2xl font-black text-red-700">
                    {queue.length}
                  </Text>
                </View>
                <View className="flex-1 rounded-2xl border border-blue-100 bg-blue-50 p-3">
                  <Text className="text-[9px] font-black uppercase text-blue-600">
                    Đang nấu
                  </Text>
                  <Text className="mt-1 text-2xl font-black text-blue-700">
                    {cookingOrders.length}
                  </Text>
                </View>
              </View>

              <Pressable
                accessibilityLabel="Nhận đơn ưu tiên tiếp theo"
                accessibilityRole="button"
                className="mt-3 min-h-12 flex-row items-center justify-center rounded-2xl bg-red-600 px-4 active:bg-red-700 disabled:opacity-50"
                disabled={actionKey !== null || queue.length === 0}
                onPress={() => runKitchenAction("next")}
              >
                {actionKey === "next:next" ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Ionicons name="play" size={18} color="white" />
                    <Text className="ml-2 text-xs font-black text-white">
                      {queue.length === 0
                        ? "Không có đơn cần nhận"
                        : "Nhận đơn ưu tiên tiếp theo"}
                    </Text>
                  </>
                )}
              </Pressable>
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
                      <Text className="mb-2 text-xs font-bold text-red-600">
                        Điểm ưu tiên: {order.priorityScore}
                      </Text>
                      <Pressable
                        className="items-center rounded-2xl bg-red-600 py-3 active:bg-red-700 disabled:opacity-50"
                        disabled={actionKey !== null}
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
                      disabled={actionKey !== null}
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
