import { getAreaForRole } from "@/src/application/access/roles";
import { APP_ROUTES } from "@/src/application/navigation/routes";
import { useAuthSession } from "@/src/features/auth/model/AuthSessionContext";
import { MainBottomBar } from "@/src/components/layout/MainBottomBar";
import { ProfileSheet } from "@/src/components/layout/ProfileSheet";
import { AttendanceScannerModal } from "@/src/features/workschedule/ui/AttendanceScannerModal";
import { Stack, router, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MainLayout() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { loading, isAuth, user } = useAuthSession();
  const [scannerVisible, setScannerVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const area = getAreaForRole(user?.role);
  const homeActive = pathname.endsWith("/home");

  useEffect(() => {
    if (!loading && !isAuth) router.replace(APP_ROUTES.auth.login);
  }, [isAuth, loading]);

  return (
    <View className="flex-1 bg-white">
      {!homeActive && (
        <View
          className="border-b border-gray-100 bg-white px-4"
          style={{
            paddingTop: insets.top + 8,
            paddingBottom: 8,
            minHeight: 56 + insets.top,
          }}
        >
          <Text className="text-xl font-extrabold tracking-tight text-slate-800">
            Work<Text className="text-blue-600">Space</Text>
          </Text>
        </View>
      )}

      <View className="flex-1">
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="admin" />
          <Stack.Screen name="user" />
        </Stack>
      </View>

      <MainBottomBar
        area={area}
        homeActive={homeActive}
        profileActive={profileVisible}
        onOpenProfile={() => setProfileVisible(true)}
        onOpenScanner={() => setScannerVisible(true)}
      />

      <AttendanceScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
      />
      <ProfileSheet
        area={area}
        visible={profileVisible}
        onClose={() => setProfileVisible(false)}
      />
    </View>
  );
}
