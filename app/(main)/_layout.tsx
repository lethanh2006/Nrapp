import { Stack, router } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function MainLayout() {
  return (
    <View className="flex-1 bg-white">
      <View className="h-14 flex-row items-center px-4 border-b border-gray-200">
        <Pressable
          onPress={() => router.replace("/(main)/home")}
          className="px-3 py-1 bg-blue-500 rounded-lg"
        >
          <Text className="text-white font-semibold">Home</Text>
        </Pressable>
        <Text className="ml-4 text-lg font-semibold">My App</Text>
      </View>

      <View className="flex-1">
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="home" />
          <Stack.Screen name="chat" />
        </Stack>
      </View>
    </View>
  );
}
