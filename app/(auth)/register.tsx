import { BASE_URL } from "@/constants/api";
import axios from "axios";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
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
      const { data } = await axios.post(`${BASE_URL}/user/register`, {
        username: username.trim(),
        email: email.trim(),
        password: password.trim(),
      });

      Alert.alert("Thành công", "Đăng ký tài khoản thành công!");

      router.replace({
        pathname: "/(auth)/login",
        params: { email: email.trim() },
      });
    } catch (err: any) {
      Alert.alert("Lỗi", err.response?.data?.message || "Không thể đăng ký");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 justify-center bg-white p-4"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
      >
        <View className="rounded-2xl border border-[#e5e5ea] bg-white p-6">
          <Text className="mb-2 text-center text-[22px] font-semibold text-black">
            Tạo tài khoản
          </Text>
          <Text className="mb-6 text-center text-sm text-[#999999]">
            Tham gia cùng Công ty TNHH HDG
          </Text>

          <TextInput
            className="mb-3 rounded-lg border border-[#e5e5ea] bg-[#f5f5f5] p-[14px] text-base text-black"
            placeholder="Tên đăng nhập"
            placeholderTextColor="#aaaaaa"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            editable={!loading}
          />

          <TextInput
            className="mb-3 rounded-lg border border-[#e5e5ea] bg-[#f5f5f5] p-[14px] text-base text-black"
            placeholder="Email"
            placeholderTextColor="#aaaaaa"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />

          <TextInput
            className="mb-3 rounded-lg border border-[#e5e5ea] bg-[#f5f5f5] p-[14px] text-base text-black"
            placeholder="Mật khẩu"
            placeholderTextColor="#aaaaaa"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          <TextInput
            className="mb-5 rounded-lg border border-[#e5e5ea] bg-[#f5f5f5] p-[14px] text-base text-black"
            placeholder="Xác nhận mật khẩu"
            placeholderTextColor="#aaaaaa"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!loading}
          />

          <Pressable
            className="items-center rounded-lg bg-[#0084FF] p-[14px]"
            style={loading ? { opacity: 0.6 } : undefined}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-base font-semibold text-white">
                Đăng ký ngay
              </Text>
            )}
          </Pressable>

          <View className="mt-4 flex-row justify-center">
            <Text className="text-[#999999]">Đã có tài khoản? </Text>
            <Pressable onPress={() => router.back()}>
              <Text className="font-semibold text-[#0084FF]">Đăng nhập</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
