import { useAppData } from "@/context/AppContext";
import { canAccessArea, getAreaForRole, type AppArea } from "@/src/core/auth/roles";
import { APP_ROUTES } from "@/src/core/navigation/routes";
import { Redirect, Slot } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function AreaGuard({ area }: { area: AppArea }) {
  const { isAuth, loading, user } = useAppData();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!isAuth || !user) return <Redirect href={APP_ROUTES.auth.login} />;
  if (!canAccessArea(user.role, area)) {
    return <Redirect href={APP_ROUTES[getAreaForRole(user.role)].home} />;
  }

  return <Slot />;
}

