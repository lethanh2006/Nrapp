import { getAreaForRole } from "@/src/application/access/roles";
import { APP_ROUTES } from "@/src/application/navigation/routes";
import { useAuthSession } from "@/src/features/auth/model/AuthSessionContext";
import {
  AuthInput,
  AuthScreen,
} from "@/src/features/auth/ui/AuthForm";
import { loginUser } from "@/src/services/auth/auth.service";
import { getApiErrorMessage } from "@/src/utils/apiHelper";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  View,
} from "react-native";

export default function LoginScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const { isAuth, loading: userLoading, user } = useAuthSession();
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState(
    typeof params.email === "string" ? params.email : "",
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userLoading && isAuth) {
      router.replace(APP_ROUTES[getAreaForRole(user?.role)].home);
    }
  }, [isAuth, user?.role, userLoading]);

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Thông báo", "Vui lòng nhập đầy đủ thông tin");
      return;
    }

    setLoading(true);
    try {
      const { data } = await loginUser({
        email: email.trim().toLowerCase(),
        password,
      });

      Alert.alert("Thành công", data.message || "Đăng nhập thành công");
      router.push({
        pathname: "/(auth)/verify",
        params: { email: email.trim() },
      });
    } catch (err: unknown) {
      Alert.alert("Lỗi", getApiErrorMessage(err, "Không thể đăng nhập"));
    } finally {
      setLoading(false);
    }
  };

  if (userLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#f4f7fb]">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <AuthScreen
      eyebrow="HDG Workspace"
      title="Chào mừng trở lại"
      subtitle="Đăng nhập để tiếp tục công việc và kết nối cùng đội ngũ của bạn."
    >
      <View className="rounded-[28px] border border-white bg-white p-5 shadow-xl shadow-slate-200/80">
        <AuthInput
          label="Email công việc"
          icon="mail-outline"
          placeholder="name@hdg.com.vn"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          returnKeyType="next"
          editable={!loading}
        />

        <AuthInput
          label="Mật khẩu"
          icon="lock-closed-outline"
          placeholder="Nhập mật khẩu của bạn"
          value={password}
          onChangeText={setPassword}
          secure
          autoComplete="current-password"
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
          editable={!loading}
        />

        <Pressable
          className="mt-1 min-h-14 flex-row items-center justify-center rounded-2xl bg-[#153b6f] px-5 shadow-md shadow-blue-900/30 active:bg-[#0f2d56]"
          style={loading ? { opacity: 0.65 } : undefined}
          onPress={handleSubmit}
          disabled={loading}
          accessibilityRole="button"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text className="text-base font-extrabold text-white">
                Đăng nhập
              </Text>
              <Ionicons
                name="arrow-forward"
                size={19}
                color="#ffffff"
                style={{ marginLeft: 8 }}
              />
            </>
          )}
        </Pressable>

        <View className="my-5 h-px bg-slate-100" />

        <View className="flex-row flex-wrap items-center justify-center">
          <Text className="text-sm font-medium text-slate-500">
            {"Chưa có tài khoản? "}
          </Text>
          <Pressable onPress={() => router.push("/(auth)/register")}>
            <Text className="text-sm font-extrabold text-blue-700">
              Đăng ký ngay
            </Text>
          </Pressable>
        </View>
      </View>
    </AuthScreen>
  );
}
