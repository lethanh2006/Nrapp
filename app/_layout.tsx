import { AuthSessionProvider } from "@/src/features/auth/model/AuthSessionContext";
import { ChatSocketProvider } from "@/src/features/chat/shared/model/ChatSocketContext";
import { useColorScheme } from "@/src/shared/hooks/useColorScheme";
import { AppAlertHost } from "@/src/shared/ui/AppAlert";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { Platform } from "react-native";
import { useEffect } from "react";
import { configureReanimatedLogger, ReanimatedLogLevel } from "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (Platform.OS === "web") return;

    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
    if (!webClientId) return;

    GoogleSignin.configure({ webClientId });
  }, []);

  return (
    <SafeAreaProvider>
      <AuthSessionProvider>
        <ChatSocketProvider>
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          >
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(main)" />
            </Stack>
            <AppAlertHost />
            <StatusBar style="auto" />
          </ThemeProvider>
        </ChatSocketProvider>
      </AuthSessionProvider>
    </SafeAreaProvider>
  );
}
