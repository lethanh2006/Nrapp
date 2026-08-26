import { useAuthSession } from "@/src/features/auth/model/AuthSessionContext";
import {
  formatDateTime,
  formatMoney,
  getCanteenErrorMessage,
} from "@/src/features/canteen/shared/model/presentation";
import {
  consumeCanteenIngredient,
  createCanteenIngredient,
  createCanteenInventoryBatch,
  deleteCanteenIngredient,
  getCanteenInventoryExpiryAlerts,
  listCanteenIngredients,
  updateCanteenIngredient,
  type CanteenIngredient,
  type CreateCanteenIngredientInput,
  type InventoryExpiryAlert,
} from "@/src/services/canteen/inventory.service";
import { AppAlert as Alert } from "@/src/shared/ui/AppAlert";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

type Props = {
  canManageResources?: boolean;
  refreshKey?: number;
};

const isPositiveNumber = (value: number) =>
  Number.isFinite(value) && value >= 0.001;

const getDaysUntilExpiry = (value: string) => {
  const expiry = new Date(value).getTime();
  if (Number.isNaN(expiry)) return null;
  return Math.max(0, Math.ceil((expiry - Date.now()) / 86_400_000));
};

export default function AdminInventoryManager({
  canManageResources = true,
  refreshKey = 0,
}: Props) {
  const { getToken } = useAuthSession();
  const [ingredients, setIngredients] = useState<CanteenIngredient[]>([]);
  const [expiryAlerts, setExpiryAlerts] = useState<InventoryExpiryAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [selectedIngredientId, setSelectedIngredientId] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [minimumThreshold, setMinimumThreshold] = useState("0");

  const [batchQuantity, setBatchQuantity] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [supplier, setSupplier] = useState("");
  const [consumeQuantity, setConsumeQuantity] = useState("");

  const loadInventory = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) setLoading(true);
        const token = await getToken();
        if (!token) return;
        const [ingredientResult, alerts] = await Promise.all([
          listCanteenIngredients({
            page: 1,
            limit: 100,
            sortBy: "name",
            sortOrder: "asc",
          }),
          getCanteenInventoryExpiryAlerts(token),
        ]);
        setIngredients(ingredientResult.data);
        setExpiryAlerts(alerts);
        setSelectedIngredientId((current) =>
          ingredientResult.data.some((ingredient) => ingredient._id === current)
            ? current
            : (ingredientResult.data[0]?._id ?? ""),
        );
      } catch (error) {
        Alert.alert(
          "Lỗi",
          getCanteenErrorMessage(error, "Không tải được dữ liệu kho"),
        );
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [getToken],
  );

  useEffect(() => {
    void loadInventory();
  }, [loadInventory, refreshKey]);

  const selectedIngredient = useMemo(
    () =>
      ingredients.find(
        (ingredient) => ingredient._id === selectedIngredientId,
      ),
    [ingredients, selectedIngredientId],
  );

  const selectedBatches = useMemo(
    () =>
      expiryAlerts.filter(
        (batch) => batch.ingredientId === selectedIngredientId,
      ),
    [expiryAlerts, selectedIngredientId],
  );

  const selectedStock = useMemo(
    () => selectedBatches.reduce((total, batch) => total + batch.quantity, 0),
    [selectedBatches],
  );

  const resetIngredientForm = () => {
    setEditingId(null);
    setName("");
    setUnit("");
    setMinimumThreshold("0");
  };

  const startEditing = (ingredient: CanteenIngredient) => {
    setEditingId(ingredient._id);
    setName(ingredient.name);
    setUnit(ingredient.unit);
    setMinimumThreshold(String(ingredient.minimumThreshold));
  };

  const saveIngredient = async () => {
    const normalizedName = name.trim();
    const normalizedUnit = unit.trim();
    const normalizedThreshold = Number(minimumThreshold.trim());
    if (!normalizedName || !normalizedUnit) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập tên và đơn vị nguyên liệu");
      return;
    }
    if (!Number.isFinite(normalizedThreshold) || normalizedThreshold < 0) {
      Alert.alert("Ngưỡng không hợp lệ", "Ngưỡng cảnh báo phải từ 0 trở lên");
      return;
    }

    const payload: CreateCanteenIngredientInput = {
      name: normalizedName,
      unit: normalizedUnit,
      minimumThreshold: normalizedThreshold,
    };
    const key = editingId ? `save:${editingId}` : "create-ingredient";
    try {
      setBusyKey(key);
      const token = await getToken();
      if (!token) return;
      if (editingId) {
        await updateCanteenIngredient(token, editingId, payload);
      } else {
        const created = await createCanteenIngredient(token, payload);
        setSelectedIngredientId(created._id);
      }
      await loadInventory(false);
      resetIngredientForm();
      Alert.alert(
        "Thành công",
        editingId ? "Đã cập nhật nguyên liệu" : "Đã tạo nguyên liệu",
      );
    } catch (error) {
      Alert.alert(
        "Lỗi",
        getCanteenErrorMessage(error, "Không lưu được nguyên liệu"),
      );
    } finally {
      setBusyKey(null);
    }
  };

  const removeIngredient = async (ingredient: CanteenIngredient) => {
    try {
      setBusyKey(`delete:${ingredient._id}`);
      const token = await getToken();
      if (!token) return;
      await deleteCanteenIngredient(token, ingredient._id);
      if (editingId === ingredient._id) resetIngredientForm();
      await loadInventory(false);
      Alert.alert("Thành công", `Đã xóa ${ingredient.name}`);
    } catch (error) {
      Alert.alert(
        "Không thể xóa",
        getCanteenErrorMessage(
          error,
          "Nguyên liệu đã có lô kho nên không thể xóa",
        ),
      );
    } finally {
      setBusyKey(null);
    }
  };

  const confirmRemove = (ingredient: CanteenIngredient) => {
    Alert.alert(
      "Xóa nguyên liệu?",
      `Xóa “${ingredient.name}”? Nguyên liệu đã từng nhập kho sẽ bị từ chối.`,
      [
        { text: "Không", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => void removeIngredient(ingredient),
        },
      ],
    );
  };

  const createBatch = async () => {
    const quantity = Number(batchQuantity.trim());
    const price = Number(costPrice.trim());
    const parsedExpiry = new Date(expiryDate.trim());
    if (!selectedIngredientId) {
      Alert.alert("Chưa chọn nguyên liệu", "Hãy chọn nguyên liệu cần nhập kho");
      return;
    }
    if (!isPositiveNumber(quantity)) {
      Alert.alert("Số lượng không hợp lệ", "Số lượng nhập phải lớn hơn 0");
      return;
    }
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(expiryDate.trim()) ||
      Number.isNaN(parsedExpiry.getTime()) ||
      parsedExpiry.getTime() <= Date.now()
    ) {
      Alert.alert(
        "Hạn dùng không hợp lệ",
        "Nhập ngày tương lai theo định dạng YYYY-MM-DD",
      );
      return;
    }
    if (!Number.isSafeInteger(price) || price < 0) {
      Alert.alert("Giá nhập không hợp lệ", "Giá nhập phải là số nguyên không âm");
      return;
    }

    try {
      setBusyKey("create-batch");
      const token = await getToken();
      if (!token) return;
      await createCanteenInventoryBatch(token, {
        ingredientId: selectedIngredientId,
        quantity,
        expiryDate: expiryDate.trim(),
        costPrice: price,
        supplier: supplier.trim() || undefined,
      });
      setBatchQuantity("");
      setExpiryDate("");
      setCostPrice("");
      setSupplier("");
      await loadInventory(false);
      Alert.alert("Thành công", "Đã nhập lô nguyên liệu mới");
    } catch (error) {
      Alert.alert(
        "Lỗi",
        getCanteenErrorMessage(error, "Không nhập được lô nguyên liệu"),
      );
    } finally {
      setBusyKey(null);
    }
  };

  const consumeIngredient = async () => {
    const quantity = Number(consumeQuantity.trim());
    if (!selectedIngredientId) {
      Alert.alert("Chưa chọn nguyên liệu", "Hãy chọn nguyên liệu cần tiêu hao");
      return;
    }
    if (!isPositiveNumber(quantity)) {
      Alert.alert("Số lượng không hợp lệ", "Số lượng tiêu hao phải lớn hơn 0");
      return;
    }

    try {
      setBusyKey("consume");
      const token = await getToken();
      if (!token) return;
      const result = await consumeCanteenIngredient(
        token,
        selectedIngredientId,
        quantity,
      );
      setConsumeQuantity("");
      await loadInventory(false);
      Alert.alert(
        result.ingredient.isLowStock ? "Đã tiêu hao · Sắp hết hàng" : "Đã tiêu hao",
        `Còn ${result.ingredient.totalRemainingStock} ${result.ingredient.unit} trong kho.`,
      );
    } catch (error) {
      Alert.alert(
        "Không thể tiêu hao",
        getCanteenErrorMessage(error, "Tồn kho không đủ hoặc vừa thay đổi"),
      );
    } finally {
      setBusyKey(null);
    }
  };

  if (loading) {
    return (
      <View className="items-center py-20">
        <ActivityIndicator color="#ea580c" size="large" />
      </View>
    );
  }

  return (
    <View>
      <View className="mb-4 rounded-3xl bg-slate-900 p-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-base font-black text-white">Vận hành kho FEFO</Text>
            <Text className="mt-1 text-xs leading-5 text-slate-400">
              {canManageResources
                ? "Chọn nguyên liệu để nhập lô hoặc trừ lô hết hạn sớm trước."
                : "Theo dõi tồn kho và trừ lô hết hạn sớm trước khi chế biến."}
            </Text>
          </View>
          <Pressable
            accessibilityLabel="Tải lại kho"
            className="h-10 w-10 items-center justify-center rounded-xl bg-slate-700"
            onPress={() => loadInventory()}
          >
            <Ionicons color="white" name="refresh" size={17} />
          </Pressable>
        </View>

        <ScrollView
          className="-mx-4 mt-3"
          contentContainerStyle={{ paddingHorizontal: 16 }}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {ingredients.map((ingredient) => {
            const selected = selectedIngredientId === ingredient._id;
            return (
              <Pressable
                className={`mr-2 rounded-full border px-3 py-2 ${
                  selected
                    ? "border-orange-400 bg-orange-500"
                    : "border-slate-600 bg-slate-800"
                }`}
                key={ingredient._id}
                onPress={() => setSelectedIngredientId(ingredient._id)}
              >
                <Text
                  className={`text-xs font-black ${
                    selected ? "text-white" : "text-slate-300"
                  }`}
                >
                  {ingredient.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {selectedIngredient ? (
          <View className="mt-3 rounded-2xl bg-slate-800 p-3">
            <Text className="text-xs font-black text-white">
              {selectedIngredient.name}: {selectedStock} {selectedIngredient.unit}
            </Text>
            <Text className="mt-1 text-[11px] text-slate-400">
              Ngưỡng cảnh báo {selectedIngredient.minimumThreshold} {selectedIngredient.unit}
              {selectedStock <= selectedIngredient.minimumThreshold
                ? " · Sắp hết hàng"
                : ""}
            </Text>
          </View>
        ) : (
          <Text className="mt-3 text-xs font-semibold text-slate-400">
            {canManageResources
              ? "Hãy tạo nguyên liệu trước khi nhập kho."
              : "Kho chưa có nguyên liệu để vận hành."}
          </Text>
        )}
      </View>

      {selectedIngredient ? (
        <View className="mb-4 rounded-3xl border border-blue-100 bg-white p-4">
          {canManageResources ? (
            <>
              <Text className="text-base font-black text-slate-900">
                Nhập lô {selectedIngredient.name}
              </Text>
              <View className="mt-3 flex-row">
                <TextInput
                  className="mr-2 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700"
                  keyboardType="decimal-pad"
                  onChangeText={setBatchQuantity}
                  placeholder={`Số lượng (${selectedIngredient.unit})`}
                  placeholderTextColor="#94a3b8"
                  value={batchQuantity}
                />
                <TextInput
                  className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700"
                  keyboardType="number-pad"
                  onChangeText={setCostPrice}
                  placeholder="Giá nhập VND"
                  placeholderTextColor="#94a3b8"
                  value={costPrice}
                />
              </View>
              <TextInput
                autoCapitalize="none"
                className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700"
                onChangeText={setExpiryDate}
                placeholder="Hạn dùng YYYY-MM-DD"
                placeholderTextColor="#94a3b8"
                value={expiryDate}
              />
              <TextInput
                className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700"
                maxLength={160}
                onChangeText={setSupplier}
                placeholder="Nhà cung cấp (không bắt buộc)"
                placeholderTextColor="#94a3b8"
                value={supplier}
              />
              <Pressable
                className="mt-3 items-center rounded-2xl bg-blue-600 py-3.5 disabled:opacity-50"
                disabled={busyKey !== null}
                onPress={createBatch}
              >
                {busyKey === "create-batch" ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text className="text-sm font-black text-white">Nhập lô</Text>
                )}
              </Pressable>

              <View className="my-4 h-px bg-slate-100" />
            </>
          ) : null}
          <Text className="text-sm font-black text-slate-800">
            Ghi nhận tiêu hao {selectedIngredient.name}
          </Text>
          <View className="mt-2 flex-row">
            <TextInput
              className="mr-2 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700"
              keyboardType="decimal-pad"
              onChangeText={setConsumeQuantity}
              placeholder={`Số lượng (${selectedIngredient.unit})`}
              placeholderTextColor="#94a3b8"
              value={consumeQuantity}
            />
            <Pressable
              className="items-center justify-center rounded-2xl bg-amber-500 px-5 disabled:opacity-50"
              disabled={busyKey !== null}
              onPress={consumeIngredient}
            >
              {busyKey === "consume" ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className="text-xs font-black text-white">Tiêu hao</Text>
              )}
            </Pressable>
          </View>
        </View>
      ) : null}

      {canManageResources ? (
        <View className="mb-4 rounded-3xl border border-orange-100 bg-white p-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-black text-slate-900">
            {editingId ? "Chỉnh sửa nguyên liệu" : "Tạo nguyên liệu"}
          </Text>
          {editingId ? (
            <Pressable
              className="rounded-xl bg-slate-100 px-3 py-2"
              onPress={resetIngredientForm}
            >
              <Text className="text-xs font-black text-slate-600">Tạo mới</Text>
            </Pressable>
          ) : null}
        </View>
        <TextInput
          className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-800"
          maxLength={120}
          onChangeText={setName}
          placeholder="Tên nguyên liệu *"
          placeholderTextColor="#94a3b8"
          value={name}
        />
        <View className="mt-2 flex-row">
          <TextInput
            className="mr-2 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700"
            maxLength={30}
            onChangeText={setUnit}
            placeholder="Đơn vị *"
            placeholderTextColor="#94a3b8"
            value={unit}
          />
          <TextInput
            className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700"
            keyboardType="decimal-pad"
            onChangeText={setMinimumThreshold}
            placeholder="Ngưỡng cảnh báo"
            placeholderTextColor="#94a3b8"
            value={minimumThreshold}
          />
        </View>
        <Pressable
          className="mt-3 items-center rounded-2xl bg-orange-600 py-3.5 disabled:opacity-50"
          disabled={busyKey !== null}
          onPress={saveIngredient}
        >
          {busyKey === "create-ingredient" || busyKey === `save:${editingId}` ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text className="text-sm font-black text-white">
              {editingId ? "Lưu thay đổi" : "Tạo nguyên liệu"}
            </Text>
          )}
        </Pressable>
        </View>
      ) : null}

      <Text className="mb-3 text-base font-black text-slate-800">
        Nguyên liệu ({ingredients.length})
      </Text>
      {ingredients.map((ingredient) => {
        const stock = expiryAlerts
          .filter((batch) => batch.ingredientId === ingredient._id)
          .reduce((total, batch) => total + batch.quantity, 0);
        const lowStock = stock <= ingredient.minimumThreshold;
        return (
          <View
            className="mb-3 rounded-3xl border border-slate-100 bg-white p-4"
            key={ingredient._id}
          >
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-base font-black text-slate-900">
                  {ingredient.name}
                </Text>
                <Text className="mt-1 text-xs font-bold text-orange-600">
                  Tồn khả dụng: {stock} {ingredient.unit}
                </Text>
                <Text className="mt-1 text-[11px] text-slate-400">
                  Cảnh báo khi còn ≤ {ingredient.minimumThreshold} {ingredient.unit}
                </Text>
              </View>
              {lowStock ? (
                <View className="rounded-full bg-rose-50 px-2.5 py-1">
                  <Text className="text-[10px] font-black text-rose-700">
                    Sắp hết
                  </Text>
                </View>
              ) : null}
            </View>
            {canManageResources ? (
              <View className="mt-3 flex-row border-t border-slate-100 pt-3">
                <Pressable
                  className="mr-2 flex-1 items-center rounded-xl bg-slate-800 py-2.5"
                  onPress={() => {
                    setSelectedIngredientId(ingredient._id);
                    startEditing(ingredient);
                  }}
                >
                  <Text className="text-xs font-black text-white">Chỉnh sửa</Text>
                </Pressable>
                <Pressable
                  accessibilityLabel={`Xóa ${ingredient.name}`}
                  className="h-10 w-10 items-center justify-center rounded-xl bg-rose-50 disabled:opacity-40"
                  disabled={busyKey !== null}
                  onPress={() => confirmRemove(ingredient)}
                >
                  {busyKey === `delete:${ingredient._id}` ? (
                    <ActivityIndicator color="#e11d48" size="small" />
                  ) : (
                    <Ionicons color="#e11d48" name="trash-outline" size={17} />
                  )}
                </Pressable>
              </View>
            ) : null}
          </View>
        );
      })}

      <Text className="mb-3 mt-2 text-base font-black text-slate-800">
        Lô đang hoạt động theo hạn dùng ({expiryAlerts.length})
      </Text>
      {expiryAlerts.length === 0 ? (
        <View className="items-center rounded-3xl bg-white py-10">
          <Ionicons color="#cbd5e1" name="cube-outline" size={36} />
          <Text className="mt-3 text-xs font-semibold text-slate-400">
            Chưa có lô đang hoạt động
          </Text>
        </View>
      ) : (
        expiryAlerts.map((batch) => {
          const daysUntilExpiry = getDaysUntilExpiry(batch.expiryDate);
          const isUrgent = daysUntilExpiry !== null && daysUntilExpiry <= 3;
          return (
            <View
              className={`mb-3 rounded-3xl border p-4 ${
                isUrgent
                  ? "border-rose-100 bg-rose-50"
                  : "border-amber-100 bg-amber-50"
              }`}
              key={batch.batchId}
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-3">
                  <Text className="text-sm font-black text-slate-900">
                    {batch.ingredientName}
                  </Text>
                  <Text
                    className={`mt-1 text-xs font-semibold ${
                      isUrgent ? "text-rose-700" : "text-amber-700"
                    }`}
                  >
                    {daysUntilExpiry === null
                      ? "Không rõ số ngày còn lại"
                      : `Còn ${daysUntilExpiry} ngày`} · Hạn {formatDateTime(batch.expiryDate)}
                  </Text>
                  {isUrgent ? (
                    <Text className="mt-1 text-[10px] font-black uppercase text-rose-600">
                      Cần ưu tiên sử dụng
                    </Text>
                  ) : null}
                </View>
                <Text className="text-sm font-black text-slate-800">
                  {batch.quantity}/{batch.originalQuantity} {batch.unit}
                </Text>
              </View>
              <Text className="mt-2 text-[11px] text-slate-500">
                Giá lô: {formatMoney(batch.costPrice)}
                {batch.supplier ? ` · ${batch.supplier}` : ""}
              </Text>
            </View>
          );
        })
      )}
    </View>
  );
}
