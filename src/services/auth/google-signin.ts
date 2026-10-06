import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";

// Keep the production OAuth client fallback used by the installed APK.
const DEFAULT_GOOGLE_WEB_CLIENT_ID =
  "779200897119-2m0amhfd2prcpuuec18502f14vlfbh3f.apps.googleusercontent.com";
const webClientId =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ||
  DEFAULT_GOOGLE_WEB_CLIENT_ID;

export function isGoogleSigninAvailable() {
  return (
    Platform.OS !== "web" &&
    Constants.executionEnvironment !== ExecutionEnvironment.StoreClient &&
    Boolean(webClientId)
  );
}

export async function configureGoogleSignin() {
  if (!isGoogleSigninAvailable()) {
    throw new Error("Google Sign-In cần native build và Google OAuth client ID.");
  }

  // Import only when needed: Expo Go does not contain RNGoogleSignin and an
  // eager import would crash the app before email/password login can render.
  const googleSignin = await import("@react-native-google-signin/google-signin");
  googleSignin.GoogleSignin.configure({ webClientId });
  return googleSignin;
}
