import { useAppData } from "@/context/AppContext";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function WorkscheduleIndex() {
  const { user, loading } = useAppData();

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (user?.role === "admin") {
    return <Redirect href="/(main)/workschedule/admin" />;
  }

  return <Redirect href="/(main)/workschedule/user" />;
}
