import { Platform } from "react-native";

const getBaseUrl = () => {
  if (__DEV__) {
    if (Platform.OS === "web") {
      return "http://localhost";
    }

    if (Platform.OS === "android") {
      const isEmulator = /google_sdk|emulator|android_x86/i.test(
        Platform.constants?.Model || ""
      );
      
      if (isEmulator) {
        return "http://10.0.2.2";
      }
      return "http://192.168.30.178";  // ← IP WiFi của bạn
    }

    return "http://192.168.30.178";    // ← iOS máy thật
  }

  return "https://your-backend.com";
};

const base = getBaseUrl();

export const BASE_URL = `${base}:3000/api`;
