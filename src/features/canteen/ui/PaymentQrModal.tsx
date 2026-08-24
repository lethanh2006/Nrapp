import { formatDateTime, formatMoney } from "@/src/features/canteen/model/presentation";
import {
  PAYMENT_STATUS_LABELS,
  type PaymentRecord,
} from "@/src/services/payment/constant";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type PaymentQrModalProps = {
  visible: boolean;
  payment: PaymentRecord | null;
  loading: boolean;
  onClose: () => void;
  onRefresh: () => void;
};

const statusColor: Record<PaymentRecord["status"], string> = {
  PENDING: "#d97706",
  SUCCESS: "#059669",
  FAILED: "#dc2626",
  EXPIRED: "#64748b",
  REVIEW_REQUIRED: "#7c3aed",
  REFUNDED: "#475569",
};

export default function PaymentQrModal({
  visible,
  payment,
  loading,
  onClose,
  onRefresh,
}: PaymentQrModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      visible={visible}
    >
      <View
        className="flex-1 bg-slate-50"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <View className="flex-row items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
          <View>
            <Text className="text-lg font-black text-slate-900">
              Thanh toán VietQR
            </Text>
            <Text className="mt-0.5 text-xs text-slate-400">
              Quét đúng nội dung và số tiền bên dưới
            </Text>
          </View>
          <Pressable
            accessibilityLabel="Đóng thanh toán"
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
            onPress={onClose}
          >
            <Ionicons name="close" size={22} color="#475569" />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="p-4"
          showsVerticalScrollIndicator={false}
        >
          {loading && !payment ? (
            <View className="items-center py-20">
              <ActivityIndicator size="large" color="#e11d48" />
              <Text className="mt-3 text-sm font-semibold text-slate-500">
                Đang tạo mã thanh toán…
              </Text>
            </View>
          ) : payment ? (
            <View className="overflow-hidden rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm">
              <View className="items-center">
                <View className="h-72 w-72 overflow-hidden rounded-3xl border border-slate-100 bg-white p-2">
                  <Image
                    resizeMode="contain"
                    source={{ uri: payment.qrUrl }}
                    className="h-full w-full"
                  />
                </View>
                <Text className="mt-5 text-3xl font-black text-rose-600">
                  {formatMoney(payment.amount)}
                </Text>
                <Text
                  className="mt-2 text-sm font-black uppercase"
                  style={{ color: statusColor[payment.status] }}
                >
                  {PAYMENT_STATUS_LABELS[payment.status]}
                </Text>
              </View>

              <View className="mt-5 rounded-2xl bg-slate-50 p-4">
                <Text className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Nội dung chuyển khoản
                </Text>
                <Text selectable className="mt-1 text-base font-black text-slate-900">
                  {payment.transferContent}
                </Text>
                <Text className="mt-3 text-xs font-semibold text-slate-500">
                  Hết hạn: {formatDateTime(payment.expiresAt)}
                </Text>
                <Text className="mt-1 text-xs text-slate-400">
                  Mã giao dịch: {payment.paymentId}
                </Text>
              </View>

              <Pressable
                className="mt-4 flex-row items-center justify-center rounded-2xl border border-slate-200 bg-white py-3 active:bg-slate-50"
                onPress={() => Linking.openURL(payment.qrUrl)}
              >
                <Ionicons name="open-outline" size={18} color="#475569" />
                <Text className="ml-2 text-sm font-extrabold text-slate-600">
                  Mở ảnh QR
                </Text>
              </Pressable>

              <Pressable
                className="mt-3 flex-row items-center justify-center rounded-2xl bg-rose-600 py-3.5 active:bg-rose-700 disabled:opacity-50"
                disabled={loading}
                onPress={onRefresh}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Ionicons name="refresh" size={18} color="white" />
                )}
                <Text className="ml-2 text-sm font-black text-white">
                  Cập nhật trạng thái
                </Text>
              </Pressable>
            </View>
          ) : (
            <View className="items-center py-20">
              <Ionicons name="alert-circle-outline" size={42} color="#94a3b8" />
              <Text className="mt-3 text-sm font-semibold text-slate-500">
                Không lấy được thông tin thanh toán
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
