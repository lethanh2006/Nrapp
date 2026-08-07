import type { AppArea } from "@/src/application/access/roles";
import { APP_ROUTES } from "@/src/application/navigation/routes";
import { useAuthSession } from "@/src/features/auth/model/AuthSessionContext";
import { AppAlert as Alert } from "@/src/shared/ui/AppAlert";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import type { ComponentProps, ReactNode } from "react";
import {
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type IconName = ComponentProps<typeof Ionicons>["name"];

type ProfileScreenProps = {
  area: AppArea;
};

function InfoRow({
  icon,
  label,
  value,
  last = false,
}: {
  icon: IconName;
  label: string;
  value: ReactNode;
  last?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center py-4 ${
        last ? "" : "border-b border-slate-100"
      }`}
    >
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
        <Ionicons name={icon} size={19} color="#475569" />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
          {label}
        </Text>
        <Text className="text-sm font-bold leading-5 text-slate-800">
          {value}
        </Text>
      </View>
    </View>
  );
}

const getRoleLabel = (role: string | undefined, area: AppArea) => {
  if (role === "admin") return "Quản trị viên";
  if (role === "manager") return "Quản lý";
  if (role === "chef") return "Điều hành";
  return area === "admin" ? "Khối quản trị" : "Nhân viên";
};

export default function ProfileScreen({ area }: ProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const { logoutUser, user } = useAuthSession();
  const displayName = user?.name?.trim() || "Người dùng";
  const initial = displayName.charAt(0).toUpperCase();
  const roleLabel = getRoleLabel(user?.role, area);

  const logout = async () => {
    try {
      await logoutUser();
    } finally {
      router.replace(APP_ROUTES.auth.login);
    }
  };

  const confirmLogout = () => {
    Alert.alert(
      "Đăng xuất?",
      "Bạn sẽ cần đăng nhập lại để tiếp tục sử dụng WorkSpace.",
      [
        { text: "Ở lại", style: "cancel" },
        { text: "Đăng xuất", style: "destructive", onPress: logout },
      ],
    );
  };

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar style="light" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <ImageBackground
          source={require("@/assets/images/bg1.png")}
          resizeMode="cover"
          style={{ paddingTop: insets.top + 14, paddingBottom: 58 }}
        >
          <View className="absolute inset-0 bg-red-950/75" />

          <View className="mb-7 px-5">
            <View>
              <Text className="text-[11px] font-black uppercase tracking-[2px] text-white/60">
                WorkSpace
              </Text>
              <Text className="mt-1 text-2xl font-black tracking-tight text-white">
                Hồ sơ cá nhân
              </Text>
            </View>
          </View>

          <View className="items-center px-5">
            <View className="relative">
              <View className="h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-red-600 shadow-lg">
                <Text className="text-5xl font-black text-white">{initial}</Text>
              </View>
              <View className="absolute bottom-1 right-1 h-7 w-7 items-center justify-center rounded-full border-[3px] border-white bg-emerald-500">
                <Ionicons name="checkmark" size={13} color="white" />
              </View>
            </View>
            <Text className="mt-4 text-2xl font-black text-white">
              {displayName}
            </Text>
            <View className="mt-2 flex-row items-center rounded-full border border-white/15 bg-white/10 px-3 py-1.5">
              <Ionicons name="briefcase-outline" size={13} color="#fecaca" />
              <Text className="ml-1.5 text-xs font-bold text-red-100">
                {roleLabel}
              </Text>
            </View>
          </View>
        </ImageBackground>

        <View className="-mt-7 px-4">
          <View
            className="mb-4 flex-row items-center rounded-3xl border border-slate-100 bg-white p-4 shadow-sm"
            style={{ elevation: 3 }}
          >
            <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50">
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-black text-slate-800">
                Tài khoản đang hoạt động
              </Text>
              <Text className="mt-0.5 text-xs leading-4 text-slate-400">
                Phiên đăng nhập của bạn đang được bảo vệ
              </Text>
            </View>
          </View>

          <Text className="mb-3 ml-1 text-base font-black text-slate-800">
            Thông tin tài khoản
          </Text>
          <View className="mb-4 rounded-3xl border border-slate-100 bg-white px-4">
            <InfoRow
              icon="mail-outline"
              label="Email tài khoản"
              value={user?.email || "Chưa cập nhật"}
            />
            {user?.username ? (
              <InfoRow
                icon="at-outline"
                label="Tên đăng nhập"
                value={user.username}
              />
            ) : null}
            <InfoRow
              icon="id-card-outline"
              label="Mã nhân viên"
              value={user?._id || "Chưa cập nhật"}
              last
            />
          </View>

          <View className="mb-5 flex-row items-start rounded-2xl bg-blue-50 p-4">
            <Ionicons name="information-circle" size={20} color="#2563eb" />
            <Text className="ml-2 flex-1 text-xs leading-5 text-blue-700">
              Thông tin hồ sơ được đồng bộ từ hệ thống. Liên hệ quản trị viên nếu
              bạn cần thay đổi dữ liệu tài khoản.
            </Text>
          </View>

          <Pressable
            onPress={confirmLogout}
            className="flex-row items-center justify-center rounded-2xl border border-red-100 bg-red-50 py-4 active:bg-red-100"
          >
            <Ionicons name="log-out-outline" size={21} color="#dc2626" />
            <Text className="ml-2 text-sm font-black text-red-600">
              Đăng xuất khỏi hệ thống
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
