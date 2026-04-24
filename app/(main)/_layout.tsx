import { useAppData } from "@/context/AppContext";
import { Stack, router } from "expo-router";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MainLayout() {
  const insets = useSafeAreaInsets();
  const { loading, isAuth, logoutUser } = useAppData();

  useEffect(() => {
    if (!loading && !isAuth) router.replace("/(auth)/login");
  }, [loading, isAuth]);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } finally {
      router.replace("/(auth)/login");
      router.replace("/login");
    }
  };

  return (
    <View className="flex-1 bg-white">
      <View
        className="flex-row items-center justify-between px-4 border-b border-gray-200 bg-white"
        style={{
          paddingTop: insets.top + 8,
          paddingBottom: 8,
          minHeight: 56 + insets.top,
        }}
      >
        <Pressable
          onPress={handleLogout}
          className="px-3 py-1 bg-red-500 rounded-lg"
        >
          <Text className="text-white font-semibold">Đăng xuất</Text>
        </Pressable>

        <Pressable
          onPress={() => router.replace("/(main)/home")}
          className="px-3 py-1 bg-blue-500 rounded-lg"
        >
          <Text className="text-white font-semibold">Home</Text>
        </Pressable>
      </View>

      <View className="flex-1">
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="home" />
          <Stack.Screen name="chat" />
          <Stack.Screen name="todo" />
        </Stack>
      </View>

      <View
        className="flex-row items-center justify-around border-t border-gray-200 bg-white"
        style={{
          paddingBottom: insets.bottom + 4,
          paddingTop: 8,
          minHeight: 56 + insets.bottom,
        }}
      ></View>
    </View>
  );
}
