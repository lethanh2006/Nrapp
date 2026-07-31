import { APP_ROUTES } from "@/src/application/navigation/routes";
import { useAuthSession } from "@/src/features/auth/model/AuthSessionContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Modal, Pressable, Text, View } from "react-native";

type ProfileSheetProps = {
  area: "admin" | "user";
  visible: boolean;
  onClose: () => void;
};

export function ProfileSheet({
  area,
  visible,
  onClose,
}: ProfileSheetProps) {
  const { logoutUser, user } = useAuthSession();

  const logout = async () => {
    onClose();
    try {
      await logoutUser();
    } finally {
      router.replace(APP_ROUTES.auth.login);
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/60">
        <Pressable className="absolute inset-0" onPress={onClose} />
        <View className="min-h-[420px] items-center rounded-t-3xl border-t border-slate-100 bg-white p-6">
          <View className="mb-6 h-1.5 w-12 rounded-full bg-slate-200" />
          <View className="mb-6 w-full flex-row items-center justify-between">
            <Text className="text-lg font-black text-slate-800">Cá nhân</Text>
            <Pressable
              onPress={onClose}
              className="h-8 w-8 items-center justify-center rounded-full bg-slate-100"
            >
              <Ionicons name="close" size={20} color="#64748b" />
            </Pressable>
          </View>

          <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <Text className="text-3xl font-black text-red-700">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </Text>
          </View>
          <Text className="text-xl font-bold text-slate-800">
            {user?.name || "Người dùng"}
          </Text>
          <View className="mb-6 mt-1.5 rounded-full bg-slate-100 px-3 py-1">
            <Text className="text-xs font-semibold text-slate-600">
              Vai trò: {area === "admin" ? "Khối quản trị" : "Nhân viên"}
            </Text>
          </View>

          <View className="mb-6 w-full rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <View className="mb-3 flex-row items-center justify-between border-b border-slate-200/60 pb-3">
              <Text className="text-xs text-slate-400">Email tài khoản</Text>
              <Text className="text-sm font-semibold text-slate-800">
                {user?.email || "Chưa cập nhật"}
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-slate-400">Mã nhân viên (ID)</Text>
              <Text className="text-xs font-bold text-slate-800">
                {user?._id || "Chưa cập nhật"}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={logout}
            className="w-full flex-row items-center justify-center rounded-xl bg-red-600 py-3.5"
          >
            <Ionicons name="log-out-outline" size={20} color="white" />
            <Text className="ml-2 text-sm font-bold text-white">
              Đăng xuất khỏi hệ thống
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
