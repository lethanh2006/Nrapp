import { useAppData } from "@/context/AppContext";
import axios from "axios";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

export default function LoginScreen() {
  const { isAuth, loading: userLoading } = useAppData();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userLoading && isAuth) router.replace("/(main)/chat");
  }, [isAuth, userLoading]);

  const handleSubmit = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập đầy đủ thông tin");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(
        `http://localhost:3000/api/user/login`,
        {
          username: username.trim(),
          email: email.trim(),
          password: password.trim(),
        },
      );

      Alert.alert("Thành công", data.message || "Đăng nhập thành công");

      router.push({
        pathname: "/(auth)/verify",
        params: { email: email.trim() },
      });
    } catch (err: any) {
      Alert.alert("Lỗi", err.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  if (userLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 justify-center bg-white p-4"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View className="rounded-2xl border border-[#e5e5ea] bg-white p-6">
        <Text className="mb-2 text-center text-[22px] font-semibold text-black">
          Công ty TNHH HDG
        </Text>
        <Text className="mb-6 text-center text-sm text-[#999999]">
          Đăng nhập hệ thống
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
          placeholder="nhập email"
          placeholderTextColor="#aaaaaa"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
        />

        <TextInput
          className="mb-5 rounded-lg border border-[#e5e5ea] bg-[#f5f5f5] p-[14px] text-base text-black"
          placeholder="Mật khẩu"
          placeholderTextColor="#aaaaaa"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />

        <Pressable
          className="items-center rounded-lg bg-[#0084FF] p-[14px]"
          style={loading ? { opacity: 0.6 } : undefined}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-base font-semibold text-white">
              Đăng nhập
            </Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
