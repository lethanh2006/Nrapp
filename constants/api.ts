import { Platform } from 'react-native';

const getBaseUrl = () => {
  if (__DEV__) {
    // Web
    if (Platform.OS === 'web') {
      return 'http://localhost';
    }

    // Android Emulator (Android Studio)
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2';
    }

    // iOS Simulator hoặc máy thật
    return 'http://192.168.0.102';
  }

  return 'https://your-backend.com';
};

const base = getBaseUrl();

export const user_service = `${base}:5000`;
export const chat_service = `${base}:5002`;

console.log(chat_service);
