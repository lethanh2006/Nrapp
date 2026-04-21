import { useAppData } from '@/context/AppContext';
import { user_service } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const TOKEN_KEY = 'token';

export default function VerifyScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const { isAuth, setUser, setIsAuth, loading: userLoading, fetchChats, fetchUsers } = useAppData();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(300); // 5 phút
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (!userLoading && isAuth) router.replace('/(main)/chat');
  }, [isAuth, userLoading]);

  useEffect(() => {
    if (!email) router.replace('/(auth)/login');
  }, [email]);

  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const onChange = (i: number, v: string) => {
    if (!/^\d?$/.test(v)) return;
    const n = [...otp];
    n[i] = v;
    setOtp(n);
    if (v && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const onKeyPress = (i: number, e: { nativeEvent: { key: string } }) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  };

  const submit = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      Alert.alert('Lỗi', 'Nhập đủ 6 số OTP');
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post(`${user_service}/api/v1/verify`, {
        email: email || '',
        otp: code,
      });
      await AsyncStorage.setItem(TOKEN_KEY, data.token);
      setUser(data.user);
      setIsAuth(true);
      await fetchChats();
      await fetchUsers();
      router.replace('/(main)/chat');
    } catch {
      Alert.alert('Lỗi', 'OTP sai hoặc hết hạn');
    } finally {
      setLoading(false);
    }
  };

  if (userLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!email) return null;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Xác nhận OTP</Text>
        <Text style={styles.subtitle}>Nhập mã 6 số đã gửi về email của bạn</Text>

        <View style={styles.otpRow}>
          {otp.map((v, i) => (
            <TextInput
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              style={styles.otpInput}
              value={v}
              onChangeText={(t) => onChange(i, t)}
              onKeyPress={(e) => onKeyPress(i, e)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={submit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Xác nhận</Text>
          )}
        </Pressable>

        <Text style={styles.timer}>
          {timer > 0 ? `Gửi lại sau ${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, '0')}` : 'Hết thời gian'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    padding: 16,
  },
  center: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e5e5ea',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginBottom: 24,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 24,
  },
  otpInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    color: '#000000',
    fontSize: 18,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#0084FF',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  timer: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    marginTop: 16,
  },
});
