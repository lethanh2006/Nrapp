import { BASE_URL } from "@/constants/api";
import { User, useAppData } from "@/context/AppContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

const TOKEN_KEY = "token";

export default function VerifyScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const { isAuth, setUser, setIsAuth, loading: userLoading } = useAppData();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const hasRedirectedRef = useRef(false);

  const normalizeUser = (raw: any): User => ({
    _id: String(raw?._id ?? ""),
    name: String(raw?.name ?? raw?.username ?? raw?.email ?? "Unknown"),
    username: raw?.username ? String(raw.username) : undefined,
    email: String(raw?.email ?? ""),
    role: raw?.role === "admin" ? "admin" : "user",
  });

  useEffect(() => {
    if (!userLoading && isAuth && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      router.replace("/(main)/home");
    }
  }, [isAuth, userLoading]);

  useEffect(() => {
    if (!email) router.replace("/(auth)/login");
  }, [email]);

  const onChange = (i: number, v: string) => {
    if (!/^\d?$/.test(v)) return;
    const n = [...otp];
    n[i] = v;
    setOtp(n);
    if (v && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const onKeyPress = (i: number, e: { nativeEvent: { key: string } }) => {
    if (e.nativeEvent.key === "Backspace" && !otp[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  };

  const submit = async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      Alert.alert("Lỗi", "Nhập đủ 6 số OTP");
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post(`${BASE_URL}/user/verify`, {
        email: email || "",
        otp: code,
      });
      const normalizedUser = normalizeUser(data.user);
      await AsyncStorage.setItem(TOKEN_KEY, data.token);
      setUser(normalizedUser);
      setIsAuth(true);
    } catch {
      Alert.alert("Lỗi", "OTP sai hoặc hết hạn");
    } finally {
      setLoading(false);
    }
  };

  if (userLoading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!email) return null;

  return (
    <View className="flex-1 bg-white justify-center p-4">
      <View className="bg-white rounded-2xl p-6 border border-gray-200">
        <Text className="text-xl font-semibold text-black text-center mb-2">
          Xác nhận OTP
        </Text>

        <Text className="text-sm text-gray-400 text-center mb-6">
          Nhập mã 6 số đã gửi về email của bạn
        </Text>

        <View className="flex-row justify-between mb-6">
          {otp.map((v, i) => (
            <TextInput
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              className="flex-1 h-12 border border-gray-200 rounded-lg bg-gray-100 text-black text-lg text-center mx-1"
              value={v}
              onChangeText={(t) => onChange(i, t)}
              onKeyPress={(e) => onKeyPress(i, e)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        <Pressable
          className={`bg-blue-500 rounded-lg p-4 items-center ${loading ? "opacity-60" : ""}`}
          onPress={submit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-base font-semibold">Xác nhận</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
