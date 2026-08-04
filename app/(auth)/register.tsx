import {
  AuthInput,
  AuthScreen,
} from "@/src/features/auth/ui/AuthForm";
import { registerUser } from "@/src/services/auth/auth.service";
import { getApiErrorMessage } from "@/src/utils/apiHelper";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  View,
} from "react-native";

export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);
    try {
      const { data } = await registerUser({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      Alert.alert("Thành công", data.message);
      router.replace({
        pathname: "/(auth)/login",
        params: { email: email.trim() },
      });
    } catch (err: unknown) {
      Alert.alert("Lỗi", getApiErrorMessage(err, "Không thể đăng ký"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen
      eyebrow="Gia nhập HDG"
      title="Tạo tài khoản mới"
      subtitle="Một tài khoản duy nhất để truy cập không gian làm việc nội bộ HDG."
    >
      <View className="rounded-[28px] border border-white bg-white p-5 shadow-xl shadow-slate-200/80">
        <AuthInput
          label="Tên hiển thị"
          icon="person-outline"
          placeholder="Ví dụ: Nguyễn Minh Anh"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="words"
          autoComplete="name"
          returnKeyType="next"
          editable={!loading}
        />

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
          placeholder="Tạo mật khẩu"
          value={password}
          onChangeText={setPassword}
          secure
          autoComplete="new-password"
          returnKeyType="next"
          editable={!loading}
        />

        <AuthInput
          label="Xác nhận mật khẩu"
          icon="shield-checkmark-outline"
          placeholder="Nhập lại mật khẩu"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secure
          autoComplete="new-password"
          returnKeyType="done"
          onSubmitEditing={handleRegister}
          editable={!loading}
        />

        <Pressable
          className="mt-1 min-h-14 flex-row items-center justify-center rounded-2xl bg-[#c9252d] px-5 shadow-md shadow-red-900/20 active:bg-[#a91f26]"
          style={loading ? { opacity: 0.65 } : undefined}
          onPress={handleRegister}
          disabled={loading}
          accessibilityRole="button"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text className="text-base font-extrabold text-white">
                Tạo tài khoản
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
            {"Đã có tài khoản? "}
          </Text>
          <Pressable onPress={() => router.replace("/(auth)/login")}>
            <Text className="text-sm font-extrabold text-blue-700">
              Đăng nhập
            </Text>
          </Pressable>
        </View>
      </View>
    </AuthScreen>
  );
}
