import { Ionicons } from "@expo/vector-icons";
import { Chats, User } from "@/context/AppContext";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

interface ChatSideBarProps {
  embedded?: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  showAllUsers: boolean;
  setShowAllUsers: React.Dispatch<React.SetStateAction<boolean>>;
  users: User[] | null;
  loggedInUser: User | null;
  chats: Chats[] | null;
  selectedUser: string | null;
  setSelectedUser: (id: string | null) => void;
  createChat: (user: User) => void;
  onlineUsers?: string[];
}

const normalizePerson = (raw: any) => raw?.user ?? raw ?? {};

const displayName = (raw: any) => {
  const user = normalizePerson(raw);
  return user.name || user.username || user.email || "Người dùng";
};

const formatRelativeTime = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  const elapsedMinutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (elapsedMinutes < 1) return "Vừa xong";
  if (elapsedMinutes < 60) return `${elapsedMinutes} phút`;
  if (elapsedMinutes < 1440) return `${Math.floor(elapsedMinutes / 60)} giờ`;
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
};

export default function ChatSideBar({
  embedded = false,
  sidebarOpen,
  setSidebarOpen,
  showAllUsers,
  setShowAllUsers,
  users,
  loggedInUser,
  chats,
  selectedUser,
  setSelectedUser,
  createChat,
  onlineUsers = [],
}: ChatSideBarProps) {
  const [query, setQuery] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const normalizedQuery = query.trim().toLowerCase();

  const filteredUsers = useMemo(
    () =>
      (users ?? []).filter((user) => {
        if (user._id === loggedInUser?._id) return false;
        return displayName(user).toLowerCase().includes(normalizedQuery);
      }),
    [loggedInUser?._id, normalizedQuery, users],
  );

  const filteredChats = useMemo(
    () =>
      (chats ?? []).filter((item) => {
        if (unreadOnly && !item.chat.unseenCount) return false;
        return displayName(item.user).toLowerCase().includes(normalizedQuery);
      }),
    [chats, normalizedQuery, unreadOnly],
  );

  const content = (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        {showAllUsers && (
          <Pressable style={styles.iconButton} onPress={() => setShowAllUsers(false)}>
            <Ionicons name="arrow-back" size={23} color="#111827" />
          </Pressable>
        )}
        <Text style={styles.title}>{showAllUsers ? "Tin nhắn mới" : "Đoạn chat"}</Text>
        <Pressable
          accessibilityLabel={showAllUsers ? "Đóng" : "Tạo cuộc trò chuyện"}
          style={[styles.newButton, showAllUsers && styles.closeButton]}
          onPress={() => setShowAllUsers((current) => !current)}
        >
          <Ionicons name={showAllUsers ? "close" : "create-outline"} size={23} color="#fff" />
        </Pressable>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#6b7280" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={showAllUsers ? "Tìm người để nhắn tin" : "Tìm kiếm cuộc trò chuyện"}
          placeholderTextColor="#6b7280"
          style={styles.searchInput}
        />
        {!!query && (
          <Pressable onPress={() => setQuery("")}>
            <Ionicons name="close-circle" size={19} color="#9ca3af" />
          </Pressable>
        )}
      </View>

      {!showAllUsers && (
        <View style={styles.filters}>
          <Pressable
            style={[styles.filter, !unreadOnly && styles.filterActive]}
            onPress={() => setUnreadOnly(false)}
          >
            <Text style={[styles.filterText, !unreadOnly && styles.filterTextActive]}>Tất cả</Text>
          </Pressable>
          <Pressable
            style={[styles.filter, unreadOnly && styles.filterActive]}
            onPress={() => setUnreadOnly(true)}
          >
            <Text style={[styles.filterText, unreadOnly && styles.filterTextActive]}>Chưa đọc</Text>
          </Pressable>
        </View>
      )}

      {showAllUsers ? (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const online = onlineUsers.includes(item._id);
            return (
              <Pressable style={styles.row} onPress={() => createChat(item)}>
                <View style={styles.avatarWrap}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{displayName(item).charAt(0).toUpperCase()}</Text>
                  </View>
                  {online && <View style={styles.onlineDot} />}
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.name} numberOfLines={1}>{displayName(item)}</Text>
                  <Text style={styles.preview}>Nhấn để bắt đầu trò chuyện</Text>
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={<EmptyState text="Không tìm thấy người dùng" />}
        />
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item.chat._id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const person = normalizePerson(item.user);
            const latest = item.chat.latestMessage;
            const unread = item.chat.unseenCount ?? 0;
            const online = person._id && onlineUsers.includes(String(person._id));
            const selected = selectedUser === item.chat._id;
            return (
              <Pressable
                style={[styles.row, selected && styles.rowSelected]}
                onPress={() => {
                  setSelectedUser(item.chat._id);
                  setSidebarOpen(false);
                }}
              >
                <View style={styles.avatarWrap}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{displayName(person).charAt(0).toUpperCase()}</Text>
                  </View>
                  {online && <View style={styles.onlineDot} />}
                </View>
                <View style={styles.rowBody}>
                  <View style={styles.nameLine}>
                    <Text style={[styles.name, unread > 0 && styles.unreadName]} numberOfLines={1}>
                      {displayName(person)}
                    </Text>
                    <Text style={styles.time}>{formatRelativeTime(item.chat.updatedAt)}</Text>
                  </View>
                  <View style={styles.previewLine}>
                    <Text style={[styles.preview, unread > 0 && styles.unreadPreview]} numberOfLines={1}>
                      {latest ? `${latest.sender === loggedInUser?._id ? "Bạn: " : ""}${latest.text}` : "Chưa có tin nhắn"}
                    </Text>
                    {unread > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{unread > 99 ? "99+" : unread}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <EmptyState text={unreadOnly ? "Không có tin nhắn chưa đọc" : "Chưa có cuộc trò chuyện"} />
          }
        />
      )}
    </View>
  );

  if (embedded) return content;
  if (!sidebarOpen) return null;
  return (
    <Modal visible animationType="slide" onRequestClose={() => setSidebarOpen(false)}>
      {content}
    </Modal>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <View style={styles.empty}>
      <Ionicons name="chatbubbles-outline" size={42} color="#9ca3af" />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 16 },
  titleRow: { flexDirection: "row", alignItems: "center", paddingTop: 14, paddingBottom: 12, gap: 10 },
  title: { flex: 1, fontSize: 27, fontWeight: "800", color: "#111827" },
  iconButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 21, backgroundColor: "#f3f4f6" },
  newButton: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#2563eb" },
  closeButton: { backgroundColor: "#ef4444" },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 9, height: 44, borderRadius: 22, paddingHorizontal: 14, backgroundColor: "#f0f2f5" },
  searchInput: { flex: 1, paddingVertical: 0, fontSize: 15, color: "#111827" },
  filters: { flexDirection: "row", gap: 8, paddingVertical: 13 },
  filter: { borderRadius: 18, paddingHorizontal: 16, paddingVertical: 8 },
  filterActive: { backgroundColor: "#e7efff" },
  filterText: { fontSize: 14, fontWeight: "700", color: "#374151" },
  filterTextActive: { color: "#2563eb" },
  listContent: { flexGrow: 1, paddingBottom: 20 },
  row: { flexDirection: "row", alignItems: "center", minHeight: 76, paddingVertical: 8, borderRadius: 14 },
  rowSelected: { backgroundColor: "#eff6ff" },
  avatarWrap: { position: "relative", marginRight: 12 },
  avatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: "#e5e7eb", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 22, fontWeight: "700", color: "#6b7280" },
  onlineDot: { position: "absolute", right: 1, bottom: 2, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: "#fff", backgroundColor: "#22c55e" },
  rowBody: { flex: 1, minWidth: 0 },
  nameLine: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { flex: 1, fontSize: 16, fontWeight: "600", color: "#111827" },
  unreadName: { fontWeight: "800" },
  time: { fontSize: 12, color: "#9ca3af" },
  previewLine: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 8 },
  preview: { flex: 1, fontSize: 13, color: "#6b7280" },
  unreadPreview: { fontWeight: "700", color: "#374151" },
  badge: { minWidth: 20, height: 20, paddingHorizontal: 5, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#2563eb" },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  empty: { flex: 1, minHeight: 260, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 15, color: "#9ca3af" },
});
