import { Ionicons } from "@expo/vector-icons";
import type { ChatSummary } from "@/src/services/chat/constant";
import type { User } from "@/src/services/user/constant";
import React, { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

interface ChatSideBarProps {
  users: User[] | null;
  loggedInUser: User | null;
  chats: ChatSummary[] | null;
  setSelectedUser: (id: string | null) => void;
  createChat: (user: User) => Promise<void>;
  refreshUsers: () => Promise<void>;
  onlineUsers?: string[];
}

const getName = (user: User) => user.name || user.username || user.email || "Nhân viên";

const getChatUserId = (item: ChatSummary) => {
  const raw = (item.user as any)?.user ?? item.user;
  return String(raw?._id ?? "");
};

const formatRelativeTime = (value?: string) => {
  if (!value) return "";
  const elapsed = Math.floor((Date.now() - new Date(value).getTime()) / 60000);
  if (elapsed < 1) return "Vừa xong";
  if (elapsed < 60) return `${elapsed} phút`;
  if (elapsed < 1440) return `${Math.floor(elapsed / 60)} giờ`;
  return new Date(value).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
};

export default function ChatSideBar({
  users,
  loggedInUser,
  chats,
  setSelectedUser,
  createChat,
  refreshUsers,
  onlineUsers = [],
}: ChatSideBarProps) {
  const [query, setQuery] = useState("");
  const [openingUserId, setOpeningUserId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const normalizedQuery = query.trim().toLowerCase();

  const chatByUserId = useMemo(() => {
    const map = new Map<string, ChatSummary>();
    (chats ?? []).forEach((item) => map.set(getChatUserId(item), item));
    return map;
  }, [chats]);

  const employees = useMemo(
    () =>
      (users ?? [])
        .filter((user) => user._id !== loggedInUser?._id)
        .filter((user) => {
          const searchable = `${getName(user)} ${user.email ?? ""}`.toLowerCase();
          return searchable.includes(normalizedQuery);
        })
        .sort((left, right) => {
          const leftChat = chatByUserId.get(left._id);
          const rightChat = chatByUserId.get(right._id);
          if (leftChat && !rightChat) return -1;
          if (!leftChat && rightChat) return 1;
          if (leftChat && rightChat) {
            return new Date(rightChat.chat.updatedAt).getTime() - new Date(leftChat.chat.updatedAt).getTime();
          }
          return getName(left).localeCompare(getName(right), "vi");
        }),
    [chatByUserId, loggedInUser?._id, normalizedQuery, users],
  );

  const openEmployee = async (employee: User) => {
    if (openingUserId) return;
    const existingChat = chatByUserId.get(employee._id);
    if (existingChat) {
      setSelectedUser(existingChat.chat._id);
      return;
    }
    setOpeningUserId(employee._id);
    try {
      await createChat(employee);
    } finally {
      setOpeningUserId(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.title}>Tin nhắn</Text>
          <Text style={styles.subtitle}>{employees.length} nhân viên</Text>
        </View>
        <View style={styles.companyIcon}>
          <Ionicons name="people" size={22} color="#2563eb" />
        </View>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#6b7280" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Tìm nhân viên theo tên hoặc email"
          placeholderTextColor="#6b7280"
          style={styles.searchInput}
          autoCapitalize="none"
        />
        {!!query && (
          <Pressable onPress={() => setQuery("")}>
            <Ionicons name="close-circle" size={19} color="#9ca3af" />
          </Pressable>
        )}
      </View>

      <FlatList
        data={employees}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        refreshing={refreshing}
        onRefresh={async () => {
          setRefreshing(true);
          try {
            await refreshUsers();
          } finally {
            setRefreshing(false);
          }
        }}
        renderItem={({ item }) => {
          const existingChat = chatByUserId.get(item._id);
          const latest = existingChat?.chat.latestMessage;
          const unread = existingChat?.chat.unseenCount ?? 0;
          const online = onlineUsers.includes(item._id);
          const opening = openingUserId === item._id;
          return (
            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() => void openEmployee(item)}
              disabled={Boolean(openingUserId)}
            >
              <View style={styles.avatarWrap}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getName(item).charAt(0).toUpperCase()}</Text>
                </View>
                {online && <View style={styles.onlineDot} />}
              </View>
              <View style={styles.rowBody}>
                <View style={styles.nameLine}>
                  <Text style={[styles.name, unread > 0 && styles.unreadName]} numberOfLines={1}>
                    {getName(item)}
                  </Text>
                  <Text style={styles.time}>{formatRelativeTime(existingChat?.chat.updatedAt)}</Text>
                </View>
                <View style={styles.previewLine}>
                  <Text style={[styles.preview, unread > 0 && styles.unreadPreview]} numberOfLines={1}>
                    {opening
                      ? "Đang mở cuộc trò chuyện..."
                      : latest
                        ? `${latest.sender === loggedInUser?._id ? "Bạn: " : ""}${latest.text}`
                        : item.email || "Nhấn để bắt đầu trò chuyện"}
                  </Text>
                  {unread > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{unread > 99 ? "99+" : unread}</Text>
                    </View>
                  )}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={44} color="#9ca3af" />
            <Text style={styles.emptyText}>
              {query ? "Không tìm thấy nhân viên" : "Chưa có nhân viên nào khác"}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 16 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 14, paddingBottom: 13 },
  title: { fontSize: 27, fontWeight: "800", color: "#111827" },
  subtitle: { marginTop: 2, fontSize: 13, color: "#6b7280" },
  companyIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#eff6ff" },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 9, height: 46, borderRadius: 23, paddingHorizontal: 14, marginBottom: 10, backgroundColor: "#f0f2f5" },
  searchInput: { flex: 1, paddingVertical: 0, fontSize: 15, color: "#111827" },
  listContent: { flexGrow: 1, paddingBottom: 20 },
  row: { flexDirection: "row", alignItems: "center", minHeight: 78, paddingVertical: 8, paddingHorizontal: 4, borderRadius: 14 },
  rowPressed: { backgroundColor: "#f8fafc" },
  avatarWrap: { position: "relative", marginRight: 12 },
  avatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: "#e5e7eb", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 22, fontWeight: "700", color: "#6b7280" },
  onlineDot: { position: "absolute", right: 1, bottom: 2, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: "#fff", backgroundColor: "#22c55e" },
  rowBody: { flex: 1, minWidth: 0, marginRight: 6 },
  nameLine: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { flex: 1, fontSize: 16, fontWeight: "600", color: "#111827" },
  unreadName: { fontWeight: "800" },
  time: { fontSize: 12, color: "#9ca3af" },
  previewLine: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 8 },
  preview: { flex: 1, fontSize: 13, color: "#6b7280" },
  unreadPreview: { fontWeight: "700", color: "#374151" },
  badge: { minWidth: 20, height: 20, paddingHorizontal: 5, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#2563eb" },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  empty: { flex: 1, minHeight: 300, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 15, color: "#9ca3af" },
});
