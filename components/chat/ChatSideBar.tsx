import { User } from '@/context/AppContext';
import { Chats } from '@/context/AppContext';
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ChatSideBarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  showAllUsers: boolean;
  setShowAllUsers: React.Dispatch<React.SetStateAction<boolean>>;
  users: User[] | null;
  loggedInUser: User | null;
  chats: Chats[] | null;
  selectedUser: string | null;
  setSelectedUser: (id: string | null) => void;
  handleLogout: () => void;
  createChat: (user: User) => void;
  onlineUsers?: string[];
}

export default function ChatSideBar({
  sidebarOpen,
  setSidebarOpen,
  showAllUsers,
  setShowAllUsers,
  users,
  loggedInUser,
  chats,
  selectedUser,
  setSelectedUser,
  handleLogout,
  createChat,
  onlineUsers = [],
}: ChatSideBarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = users?.filter(
    (u) =>
      u._id !== loggedInUser?._id &&
      u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const content = (
    <View style={styles.sidebar}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.logo}>
            <Ionicons name="chatbubbles" size={24} color="#fff" />
          </View>
          <Text style={styles.headerTitle}>
            {showAllUsers ? 'Chat mới' : 'Tin nhắn'}
          </Text>
          <Pressable
            style={[styles.toggleBtn, showAllUsers && styles.toggleBtnActive]}
            onPress={() => setShowAllUsers((p) => !p)}
          >
            <Ionicons
              name={showAllUsers ? 'close' : 'add'}
              size={22}
              color="#fff"
            />
          </Pressable>
        </View>
      </View>

      <View style={styles.content}>
        {showAllUsers ? (
          <>
            <View style={styles.searchWrap}>
              <Ionicons name="search" size={18} color="#999999" />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm user..."
                placeholderTextColor="#aaaaaa"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {filteredUsers?.map((u) => (
                <Pressable
                  key={u._id}
                  style={styles.userItem}
                  onPress={() => createChat(u)}
                >
                  <View style={styles.avatarWrap}>
                    <View style={styles.avatar}>
                      <Ionicons name="person" size={24} color="#9ca3af" />
                    </View>
                    {onlineUsers.includes(u._id) && (
                      <View style={styles.onlineDot} />
                    )}
                  </View>
                  <Text style={styles.userName} numberOfLines={1}>
                    {u.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </>
        ) : chats && chats.length > 0 ? (
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {chats.map((chat) => {
              const isSelected = selectedUser === chat.chat._id;
              const latest = chat.chat.latestMessage;
              const isMe = latest?.sender === loggedInUser?._id;
              const otherUser = chat.user || (chat as any).users?.user;
              const otherOnline = otherUser?._id && onlineUsers.includes(otherUser._id);

              return (
                <Pressable
                  key={chat.chat._id}
                  style={[styles.chatItem, isSelected && styles.chatItemSelected]}
                  onPress={() => {
                    setSelectedUser(chat.chat._id);
                    setSidebarOpen(false);
                  }}
                >
                  <View style={styles.avatarWrap}>
                    <View style={styles.avatar}>
                      <Ionicons name="person" size={24} color="#9ca3af" />
                    </View>
                    {otherOnline && <View style={styles.onlineDot} />}
                  </View>
                  <View style={styles.chatText}>
                    <Text
                      style={[styles.chatName, isSelected && styles.chatNameSelected]}
                      numberOfLines={1}
                    >
                      {otherUser?.name || chat.user?.name}
                    </Text>
                    {latest && (
                      <Text style={styles.chatPreview} numberOfLines={1}>
                        {isMe ? 'Bạn: ' : ''}{latest.text}
                      </Text>
                    )}
                  </View>
                  {(chat.chat.unseenCount || 0) > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {chat.chat.unseenCount! > 99
                          ? '99+'
                          : chat.chat.unseenCount}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        ) : (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="chatbubbles-outline" size={40} color="#6b7280" />
            </View>
            <Text style={styles.emptyText}>Chưa có cuộc trò chuyện</Text>
            <Text style={styles.emptySub}>Tạo chat mới để bắt đầu</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </Pressable>
      </View>
    </View>
  );

  if (sidebarOpen) {
    return (
      <Modal
        visible={sidebarOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setSidebarOpen(false)}
      >
        <View style={styles.modalWrapper}>
          <Pressable
            style={styles.overlay}
            onPress={() => setSidebarOpen(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            {content}
          </View>
        </View>
      </Modal>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  modalWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '85%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#e5e5ea',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  sidebar: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    padding: 16,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5ea',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    padding: 8,
    backgroundColor: '#0084FF',
    borderRadius: 10,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  toggleBtn: {
    padding: 10,
    backgroundColor: '#22c55e',
    borderRadius: 10,
  },
  toggleBtnActive: {
    backgroundColor: '#ef4444',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    padding: 0,
  },
  list: {
    flex: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    marginBottom: 8,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    marginBottom: 8,
  },
  chatItemSelected: {
    backgroundColor: '#e8f0ff',
    borderColor: '#0084FF',
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  userName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  chatText: {
    flex: 1,
    minWidth: 0,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  chatNameSelected: {
    color: '#0084FF',
  },
  chatPreview: {
    fontSize: 13,
    color: '#999999',
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 40,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999999',
  },
  emptySub: {
    fontSize: 14,
    color: '#aaaaaa',
    marginTop: 8,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e5ea',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
});