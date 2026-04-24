import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View className="flex-1 bg-white p-4 justify-center">
      <Text className="text-2xl font-bold text-center mb-8">Trang chủ</Text>

      <Pressable
        onPress={() => router.push("/(main)/chat")}
        className="bg-blue-500 p-5 rounded-2xl mb-4 items-center"
        style={({ pressed }) => ({
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text className="text-white text-lg font-semibold">Chat</Text>
      </Pressable>

      <Pressable
        onPress={() => router.push("/(main)/todo")}
        className="bg-green-500 p-5 rounded-2xl mb-4 items-center"
        style={({ pressed }) => ({
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text className="text-white text-lg font-semibold">Todo</Text>
      </Pressable>

      <Pressable
        // onPress={() => router.push("/(main)/feature2")}
        className="bg-purple-500 p-5 rounded-2xl items-center"
        style={({ pressed }) => ({
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text className="text-white text-lg font-semibold">Tiện ích 2</Text>
      </Pressable>
    </View>
  );
}
