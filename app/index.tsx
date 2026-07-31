/**
 * Landing - Redirect dựa trên auth
 */
import { useAppData } from '@/context/AppContext';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { getAreaForRole } from "@/src/core/auth/roles";
import { APP_ROUTES } from "@/src/core/navigation/routes";

export default function IndexScreen() {
  const { isAuth, loading, user } = useAppData();

  useEffect(() => {
    if (loading) return;
    if (isAuth) {
      router.replace(APP_ROUTES[getAreaForRole(user?.role)].home);
    } else {
      router.replace('/(auth)/login');
    }
  }, [isAuth, loading, user?.role]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#3b82f6" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
