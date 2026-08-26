import { useAuthSession } from "@/src/features/auth/model/AuthSessionContext";
import {
  formatDateTime,
  formatMoney,
  getCanteenErrorMessage,
} from "@/src/features/canteen/model/presentation";
import OrderSummaryCard from "@/src/features/canteen/ui/OrderSummaryCard";
import PaymentQrModal from "@/src/features/canteen/ui/PaymentQrModal";
import {
  cancelCanteenOrder,
  createCanteenOrder,
  getCanteenMenu,
  getMyCanteenOrders,
  searchCanteenMenu,
} from "@/src/services/canteen/canteen.service";
import type {
  CanteenOrder,
  CreateOrderPaymentMethod,
  MenuGroup,
  MenuItem,
} from "@/src/services/canteen/constant";
import {
  createPaymentQr,
  getPaymentHistory,
  getPaymentStatus,
} from "@/src/services/payment/payment.service";
import {
  PAYMENT_STATUS_LABELS,
  type PaymentRecord,
} from "@/src/services/payment/constant";
import { AppAlert as Alert } from "@/src/shared/ui/AppAlert";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

type UserCanteenTab = "menu" | "orders";

type CartLine = {
  key: string;
  item: MenuItem;
  quantity: number;
  selectedOptionNames: string[];
};

const paymentStatusColor: Record<PaymentRecord["status"], string> = {
  PENDING: "#d97706",
  SUCCESS: "#059669",
  FAILED: "#dc2626",
  EXPIRED: "#64748b",
  REVIEW_REQUIRED: "#7c3aed",
  REFUNDED: "#475569",
};

export default function UserCanteenScreen() {
  const { isAuth, getToken } = useAuthSession();
  const scrollRef = useRef<ScrollView>(null);
  const [tab, setTab] = useState<UserCanteenTab>("menu");
  const [menuGroups, setMenuGroups] = useState<MenuGroup[]>([]);
  const [searchResults, setSearchResults] = useState<MenuItem[] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [menuLoading, setMenuLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [draftOptions, setDraftOptions] = useState<Record<string, string[]>>({});
  const [cart, setCart] = useState<CartLine[]>([]);
  const [paymentMethod, setPaymentMethod] =
    useState<CreateOrderPaymentMethod>("CASH");
  const [submitting, setSubmitting] = useState(false);

  const [orders, setOrders] = useState<CanteenOrder[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [paymentHistoryError, setPaymentHistoryError] = useState<string | null>(
    null,
  );
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelReasons, setCancelReasons] = useState<Record<string, string>>({});
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const [qrVisible, setQrVisible] = useState(false);
  const [activePayment, setActivePayment] = useState<PaymentRecord | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const loadMenu = useCallback(async () => {
    try {
      setMenuLoading(true);
      setMenuGroups(await getCanteenMenu());
    } catch (error) {
      Alert.alert(
        "Lỗi",
        getCanteenErrorMessage(error, "Không tải được thực đơn căn tin"),
      );
    } finally {
      setMenuLoading(false);
    }
  }, []);

  const loadOrders = useCallback(
    async (showLoading = true) => {
      if (!isAuth) return;
      try {
        if (showLoading) setOrdersLoading(true);
        const token = await getToken();
        if (!token) return;
        const [orderResult, paymentResult] = await Promise.allSettled([
          getMyCanteenOrders(token),
          getPaymentHistory(token, 20),
        ]);
        if (orderResult.status === "rejected") throw orderResult.reason;
        setOrders(orderResult.value);
        if (paymentResult.status === "fulfilled") {
          setPayments(paymentResult.value);
          setPaymentHistoryError(null);
        } else {
          setPayments([]);
          setPaymentHistoryError(
            getCanteenErrorMessage(
              paymentResult.reason,
              "Không tải được lịch sử thanh toán",
            ),
          );
        }
      } catch (error) {
        Alert.alert(
          "Lỗi",
          getCanteenErrorMessage(error, "Không tải được đơn hàng của bạn"),
        );
      } finally {
        if (showLoading) setOrdersLoading(false);
      }
    },
    [getToken, isAuth],
  );

  useEffect(() => {
    void loadMenu();
  }, [loadMenu]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const keyword = searchQuery.trim();
    if (!keyword) {
      setSearchResults(null);
      setSearching(false);
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const items = await searchCanteenMenu(keyword);
        if (active) setSearchResults(items);
      } catch (error) {
        if (active) {
          Alert.alert(
            "Lỗi",
            getCanteenErrorMessage(error, "Không tìm kiếm được món ăn"),
          );
        }
      } finally {
        if (active) setSearching(false);
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const cartTotal = useMemo(
    () =>
      cart.reduce((sum, line) => {
        const optionPrice = (line.item.options ?? [])
          .filter((option) => line.selectedOptionNames.includes(option.name))
          .reduce((optionSum, option) => optionSum + option.price, 0);
        return sum + (line.item.price + optionPrice) * line.quantity;
      }, 0),
    [cart],
  );

  const toggleOption = (itemId: string, optionName: string) => {
    setDraftOptions((current) => {
      const selected = current[itemId] ?? [];
      return {
        ...current,
        [itemId]: selected.includes(optionName)
          ? selected.filter((name) => name !== optionName)
          : [...selected, optionName],
      };
    });
  };

  const addToCart = (item: MenuItem) => {
    const selectedOptionNames = [...(draftOptions[item._id] ?? [])].sort();
    const key = `${item._id}:${selectedOptionNames.join("|")}`;
    setCart((current) => {
      const existing = current.find((line) => line.key === key);
      if (existing) {
        return current.map((line) =>
          line.key === key ? { ...line, quantity: line.quantity + 1 } : line,
        );
      }
      return [...current, { key, item, quantity: 1, selectedOptionNames }];
    });
  };

  const changeCartQuantity = (key: string, change: number) => {
    setCart((current) =>
      current
        .map((line) =>
          line.key === key
            ? { ...line, quantity: line.quantity + change }
            : line,
        )
        .filter((line) => line.quantity > 0),
    );
  };

  const submitOrder = async () => {
    if (cart.length === 0) {
      Alert.alert("Thông báo", "Giỏ hàng đang trống");
      return;
    }

    try {
      setSubmitting(true);
      const token = await getToken();
      if (!token) return;
      const order = await createCanteenOrder(token, {
        paymentMethod,
        items: cart.map((line) => ({
          menuItemId: line.item._id,
          quantity: line.quantity,
          selectedOptions: line.selectedOptionNames.map((name) => ({ name })),
        })),
      });
      setCart([]);
      setDraftOptions({});
      setTab("orders");
      await loadOrders(false);
      Alert.alert(
        "Đặt món thành công",
        `Đơn ${order.orderNumber} đã được tạo. ${
          order.paymentMethod === "VIETQR"
            ? "Bạn có thể tạo mã QR trong mục Đơn của tôi."
            : "Vui lòng thanh toán tiền mặt khi nhận món."
        }`,
      );
    } catch (error) {
      Alert.alert(
        "Lỗi",
        getCanteenErrorMessage(error, "Không thể tạo đơn hàng"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const performCancel = async (order: CanteenOrder) => {
    if (order.paymentStatus === "PAID") {
      Alert.alert(
        "Không thể hủy",
        "Đơn đã thanh toán không thể hủy từ ứng dụng.",
      );
      return;
    }
    try {
      setCancellingId(order._id);
      const token = await getToken();
      if (!token) return;
      await cancelCanteenOrder(token, order._id, cancelReasons[order._id]);
      await loadOrders(false);
      Alert.alert("Thành công", `Đã hủy đơn ${order.orderNumber}`);
    } catch (error) {
      Alert.alert(
        "Lỗi",
        getCanteenErrorMessage(error, "Không thể hủy đơn hàng"),
      );
    } finally {
      setCancellingId(null);
    }
  };

  const confirmCancel = (order: CanteenOrder) => {
    if (order.paymentStatus === "PAID") {
      Alert.alert(
        "Không thể hủy",
        "Đơn đã thanh toán không thể hủy từ ứng dụng.",
      );
      return;
    }
    Alert.alert(
      "Xác nhận hủy đơn",
      `Bạn có chắc muốn hủy đơn ${order.orderNumber}?`,
      [
        { text: "Không", style: "cancel" },
        {
          text: "Hủy đơn",
          style: "destructive",
          onPress: () => performCancel(order),
        },
      ],
    );
  };

  const openPayment = async (order: CanteenOrder) => {
    setQrVisible(true);
    setActivePayment(null);
    setPaymentLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      setActivePayment(await createPaymentQr(token, order._id));
    } catch (error) {
      setQrVisible(false);
      Alert.alert(
        "Lỗi",
        getCanteenErrorMessage(error, "Không tạo được mã VietQR"),
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  const refreshPayment = async () => {
    if (!activePayment) return;
    setPaymentLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      setActivePayment(await getPaymentStatus(token, activePayment.paymentId));
      await loadOrders(false);
    } catch (error) {
      Alert.alert(
        "Lỗi",
        getCanteenErrorMessage(
          error,
          "Không cập nhật được trạng thái thanh toán",
        ),
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (tab === "menu") await loadMenu();
    else await loadOrders(false);
    setRefreshing(false);
  };

  const openCart = () => {
    setTab("menu");
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  };

  const renderMenuItem = (item: MenuItem) => {
    const selectedOptions = draftOptions[item._id] ?? [];
    return (
      <View
        key={item._id}
        className="mb-3 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm"
      >
        <View className="flex-row p-3.5">
          {item.imageUrl ? (
            <Image
              className="h-24 w-24 rounded-2xl bg-slate-100"
              resizeMode="cover"
              source={{ uri: item.imageUrl }}
            />
          ) : (
            <View className="h-24 w-24 items-center justify-center rounded-2xl bg-rose-50">
              <Ionicons name="restaurant" size={34} color="#e11d48" />
            </View>
          )}
          <View className="ml-3.5 flex-1">
            <Text className="text-base font-black text-slate-900">
              {item.name}
            </Text>
            {item.description ? (
              <Text className="mt-1 text-xs leading-5 text-slate-500">
                {item.description}
              </Text>
            ) : null}
            <View className="mt-2 flex-row items-center justify-between">
              <Text className="text-base font-black text-rose-600">
                {formatMoney(item.price)}
              </Text>
              <Pressable
                className="flex-row items-center rounded-xl bg-rose-600 px-3 py-2 active:bg-rose-700"
                onPress={() => addToCart(item)}
              >
                <Ionicons name="add" size={17} color="white" />
                <Text className="ml-1 text-xs font-black text-white">Thêm</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {item.options?.length ? (
          <View className="border-t border-slate-100 px-3.5 pb-3.5 pt-3">
            <Text className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Tùy chọn thêm
            </Text>
            <View className="flex-row flex-wrap">
              {item.options.map((option) => {
                const selected = selectedOptions.includes(option.name);
                return (
                  <Pressable
                    key={option.name}
                    className={`mb-2 mr-2 rounded-full border px-3 py-2 ${
                      selected
                        ? "border-rose-500 bg-rose-50"
                        : "border-slate-200 bg-white"
                    }`}
                    onPress={() => toggleOption(item._id, option.name)}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        selected ? "text-rose-600" : "text-slate-500"
                      }`}
                    >
                      {selected ? "✓ " : ""}
                      {option.name} +{formatMoney(option.price)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-slate-50">
      <View className="border-b border-slate-100 bg-white px-4 pb-3 pt-4">
        <View className="flex-row items-center">
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-rose-50">
            <Ionicons name="restaurant" size={23} color="#e11d48" />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-xl font-black text-slate-900">Căn tin</Text>
            <Text className="text-xs font-semibold text-slate-400">
              Chọn món và theo dõi đơn hàng của bạn
            </Text>
          </View>
          {cart.length > 0 ? (
            <Pressable
              accessibilityLabel="Mở giỏ hàng"
              className="flex-row items-center rounded-full bg-rose-600 px-2.5 py-1.5"
              onPress={openCart}
            >
              <Ionicons name="cart" size={13} color="white" />
              <Text className="ml-1 text-xs font-black text-white">
                {cart.length}
              </Text>
            </Pressable>
          ) : null}
        </View>

        <View className="mt-4 flex-row rounded-2xl bg-slate-100 p-1">
          {(
            [
              ["menu", "Thực đơn"],
              ["orders", "Đơn của tôi"],
            ] as const
          ).map(([value, label]) => (
            <Pressable
              key={value}
              className={`flex-1 items-center rounded-xl py-2.5 ${
                tab === value ? "bg-white shadow-sm" : ""
              }`}
              onPress={() => setTab(value)}
            >
              <Text
                className={`text-xs font-black ${
                  tab === value ? "text-rose-600" : "text-slate-500"
                }`}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 36 }}
        ref={scrollRef}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {tab === "menu" ? (
          <>
            <View className="mb-4 flex-row items-center rounded-2xl border border-slate-200 bg-white px-3">
              <Ionicons name="search" size={19} color="#94a3b8" />
              <TextInput
                className="h-12 flex-1 px-2 text-sm font-semibold text-slate-800"
                onChangeText={setSearchQuery}
                placeholder="Tìm món ăn…"
                placeholderTextColor="#94a3b8"
                value={searchQuery}
              />
              {searching ? <ActivityIndicator size="small" color="#e11d48" /> : null}
              {searchQuery ? (
                <Pressable onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={20} color="#94a3b8" />
                </Pressable>
              ) : null}
            </View>

            {menuLoading ? (
              <View className="items-center py-20">
                <ActivityIndicator size="large" color="#e11d48" />
              </View>
            ) : searchResults ? (
              <View>
                <Text className="mb-3 text-base font-black text-slate-800">
                  Kết quả tìm kiếm ({searchResults.length})
                </Text>
                {searchResults.map(renderMenuItem)}
                {searchResults.length === 0 ? (
                  <View className="items-center rounded-3xl bg-white py-12">
                    <Ionicons name="search-outline" size={38} color="#cbd5e1" />
                    <Text className="mt-3 text-sm font-semibold text-slate-400">
                      Không tìm thấy món phù hợp
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : (
              menuGroups.map((group) => (
                <View key={group.category._id} className="mb-3">
                  <Text className="mb-1 text-lg font-black text-slate-900">
                    {group.category.name}
                  </Text>
                  {group.category.description ? (
                    <Text className="mb-3 text-xs leading-5 text-slate-400">
                      {group.category.description}
                    </Text>
                  ) : null}
                  {group.items.map(renderMenuItem)}
                </View>
              ))
            )}

            {cart.length > 0 ? (
              <View className="mt-2 rounded-[28px] border border-rose-100 bg-white p-4 shadow-sm">
                <View className="mb-3 flex-row items-center justify-between">
                  <Text className="text-lg font-black text-slate-900">Giỏ hàng</Text>
                  <Pressable onPress={() => setCart([])}>
                    <Text className="text-xs font-bold text-slate-400">Xóa tất cả</Text>
                  </Pressable>
                </View>

                {cart.map((line) => (
                  <View
                    key={line.key}
                    className="mb-3 flex-row items-center border-b border-slate-100 pb-3"
                  >
                    <View className="flex-1 pr-3">
                      <Text className="text-sm font-black text-slate-800">
                        {line.item.name}
                      </Text>
                      {line.selectedOptionNames.length ? (
                        <Text className="mt-1 text-[11px] text-slate-400">
                          + {line.selectedOptionNames.join(", ")}
                        </Text>
                      ) : null}
                    </View>
                    <View className="flex-row items-center rounded-xl bg-slate-100 p-1">
                      <Pressable
                        className="h-8 w-8 items-center justify-center"
                        onPress={() => changeCartQuantity(line.key, -1)}
                      >
                        <Ionicons name="remove" size={16} color="#475569" />
                      </Pressable>
                      <Text className="w-7 text-center text-sm font-black text-slate-800">
                        {line.quantity}
                      </Text>
                      <Pressable
                        className="h-8 w-8 items-center justify-center"
                        onPress={() => changeCartQuantity(line.key, 1)}
                      >
                        <Ionicons name="add" size={16} color="#475569" />
                      </Pressable>
                    </View>
                  </View>
                ))}

                <Text className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Phương thức thanh toán
                </Text>
                <View className="flex-row">
                  {(["CASH", "VIETQR"] as const).map((method) => (
                    <Pressable
                      key={method}
                      className={`mr-2 flex-1 rounded-2xl border px-3 py-3 ${
                        paymentMethod === method
                          ? "border-rose-500 bg-rose-50"
                          : "border-slate-200 bg-white"
                      }`}
                      onPress={() => setPaymentMethod(method)}
                    >
                      <Text
                        className={`text-center text-xs font-black ${
                          paymentMethod === method
                            ? "text-rose-600"
                            : "text-slate-500"
                        }`}
                      >
                        {method === "CASH" ? "Tiền mặt" : "VietQR"}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <View className="mt-4 flex-row items-center justify-between">
                  <View>
                    <Text className="text-[10px] font-bold uppercase text-slate-400">
                      Tạm tính
                    </Text>
                    <Text className="text-xl font-black text-rose-600">
                      {formatMoney(cartTotal)}
                    </Text>
                  </View>
                  <Pressable
                    className="flex-row items-center rounded-2xl bg-rose-600 px-5 py-3.5 active:bg-rose-700 disabled:opacity-50"
                    disabled={submitting}
                    onPress={submitOrder}
                  >
                    {submitting ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Ionicons name="receipt" size={18} color="white" />
                    )}
                    <Text className="ml-2 text-sm font-black text-white">
                      Đặt món
                    </Text>
                  </Pressable>
                </View>
                <Text className="mt-3 text-[10px] leading-4 text-slate-400">
                  Giá cuối cùng và ưu đãi được máy chủ tính lại khi tạo đơn.
                </Text>
              </View>
            ) : null}
          </>
        ) : (
          <>
            {ordersLoading ? (
              <View className="items-center py-20">
                <ActivityIndicator size="large" color="#e11d48" />
              </View>
            ) : orders.length === 0 ? (
              <View className="items-center rounded-3xl bg-white py-14">
                <Ionicons name="receipt-outline" size={42} color="#cbd5e1" />
                <Text className="mt-3 text-sm font-semibold text-slate-400">
                  Bạn chưa có đơn hàng nào
                </Text>
                <Pressable
                  className="mt-4 rounded-2xl bg-rose-600 px-5 py-3"
                  onPress={() => setTab("menu")}
                >
                  <Text className="text-xs font-black text-white">Chọn món ngay</Text>
                </Pressable>
              </View>
            ) : (
              orders.map((order) => (
                <OrderSummaryCard
                  key={order._id}
                  order={order}
                  footer={
                    (order.status === "CREATED" &&
                      order.paymentStatus !== "PAID") ||
                    (order.paymentMethod === "VIETQR" &&
                      order.paymentStatus !== "PAID" &&
                      order.status !== "CANCELLED") ? (
                      <View>
                        {order.status === "CREATED" ? (
                          <View>
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
                            <Pressable
                              className="mb-2 items-center rounded-2xl border border-rose-200 bg-rose-50 py-2.5 disabled:opacity-50"
                              disabled={cancellingId === order._id}
                              onPress={() => confirmCancel(order)}
                            >
                              {cancellingId === order._id ? (
                                <ActivityIndicator color="#e11d48" size="small" />
                              ) : (
                                <Text className="text-xs font-black text-rose-600">
                                  Hủy đơn
                                </Text>
                              )}
                            </Pressable>
                          </View>
                        ) : null}
                        {order.paymentMethod === "VIETQR" ? (
                          <Pressable
                            className="flex-row items-center justify-center rounded-2xl bg-blue-600 py-3 active:bg-blue-700"
                            onPress={() => openPayment(order)}
                          >
                            <Ionicons name="qr-code" size={18} color="white" />
                            <Text className="ml-2 text-xs font-black text-white">
                              Tạo / xem mã VietQR
                            </Text>
                          </Pressable>
                        ) : null}
                      </View>
                    ) : undefined
                  }
                />
              ))
            )}

            <View className="mt-3">
              <Text className="mb-3 text-base font-black text-slate-800">
                Lịch sử thanh toán
              </Text>
              {paymentHistoryError ? (
                <View className="rounded-3xl border border-amber-100 bg-amber-50 p-5">
                  <Text className="text-center text-xs font-semibold leading-5 text-amber-700">
                    {paymentHistoryError}
                  </Text>
                </View>
              ) : payments.length === 0 ? (
                <View className="rounded-3xl bg-white p-5">
                  <Text className="text-center text-xs font-semibold text-slate-400">
                    Chưa có giao dịch VietQR
                  </Text>
                </View>
              ) : (
                payments.map((payment) => (
                  <Pressable
                    key={payment.paymentId}
                    className="mb-2 rounded-2xl border border-slate-100 bg-white p-3.5"
                    onPress={() => {
                      setPaymentLoading(false);
                      setActivePayment(payment);
                      setQrVisible(true);
                    }}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1 pr-3">
                        <Text className="text-sm font-black text-slate-800">
                          {formatMoney(payment.amount)}
                        </Text>
                        <Text className="mt-1 text-[11px] text-slate-400">
                          {formatDateTime(payment.createdAt)}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <Text
                          className="text-xs font-black"
                          style={{ color: paymentStatusColor[payment.status] }}
                        >
                          {PAYMENT_STATUS_LABELS[payment.status]}
                        </Text>
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color="#94a3b8"
                        />
                      </View>
                    </View>
                    <Text className="mt-2 text-[10px] text-slate-400">
                      Đơn: {payment.orderId} · GD: {payment.paymentId}
                    </Text>
                  </Pressable>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      <PaymentQrModal
        loading={paymentLoading}
        onClose={() => setQrVisible(false)}
        onRefresh={refreshPayment}
        payment={activePayment}
        visible={qrVisible}
      />
    </View>
  );
}
