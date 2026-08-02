import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ChatHeaderProps {
  user: any;
  onBack: () => void;
  isTyping: boolean;
  otherUserId?: string;
  onlineUsers?: string[];
  isRealtimeConnected?: boolean;
  hasRealtimeError?: boolean;
}

export default function ChatHeader({
  user,
  onBack,
  isTyping,
  otherUserId,
  onlineUsers = [],
  isRealtimeConnected = false,
  hasRealtimeError = false,
}: ChatHeaderProps) {
  const isOnline = otherUserId && onlineUsers.includes(otherUserId);
  const normalizedUser = user?.user ?? user;
  const displayName =
    normalizedUser?.name ||
    normalizedUser?.username ||
    normalizedUser?.email ||
    "Unknown user";

  return (
    <View style={styles.header}>
      <Pressable style={styles.backBtn} onPress={onBack}>
        <Ionicons name="arrow-back" size={24} color="#2563eb" />
      </Pressable>

      <View style={styles.userInfo}>
        {user ? (
          <>
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={28} color="#9ca3af" />
              </View>
              {isOnline && <View style={styles.onlineDot} />}
            </View>
            <View style={styles.textWrap}>
              <Text style={styles.name} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={isTyping ? styles.typing : styles.presence}>
                {isTyping
                  ? "đang nhập..."
                  : !isRealtimeConnected
                    ? hasRealtimeError
                      ? "mất kết nối realtime"
                      : "đang kết nối realtime..."
                    : isOnline
                      ? "đang hoạt động"
                      : "ngoại tuyến"}
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.placeholder}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={28} color="#6b7280" />
            </View>
            <View>
              <Text style={styles.placeholderTitle}>Chọn cuộc trò chuyện</Text>
              <Text style={styles.placeholderSub}>Chọn chat từ sidebar để bắt đầu</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e5ea',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  typing: {
    fontSize: 14,
    color: '#0084FF',
    fontStyle: 'italic',
    marginTop: 2,
  },
  presence: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  placeholder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999999',
  },
  placeholderSub: {
    fontSize: 12,
    color: '#aaaaaa',
    marginTop: 4,
  },
});
