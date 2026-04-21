/**
 * Landing - Redirect dựa trên auth
 */
import { useAppData } from '@/context/AppContext';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function IndexScreen() {
  const { isAuth, loading } = useAppData();

  useEffect(() => {
    if (loading) return;
    if (isAuth) {
      router.replace('/(main)/chat');
    } else {
      router.replace('/(auth)/login');
    }
  }, [isAuth, loading]);

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
