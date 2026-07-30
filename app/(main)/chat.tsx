import ChatHeader from "@/components/chat/ChatHeader";
import ChatMessages from "@/components/chat/ChatMessages";
import ChatSideBar from "@/components/chat/ChatSideBar";
import MessageInput from "@/components/chat/MessageInput";
import { User, useAppData } from "@/context/AppContext";
import { useSocketData } from "@/context/SocketContext";
import { getApiErrorMessage } from "@/services/api";
import { chatService, type ChatImageUpload } from "@/services/chat";
import type { Message } from "@/types/chat";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from "react-native";

export default function ChatScreen() {
  const {
    loading,
    isAuth,
    chats,
    user: loggedInUser,
    users,
    fetchChats,
  } = useAppData();
  const { socket, onlineUsers } = useSocketData();

  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [chatUser, setChatUser] = useState<any>(null);
  const [showAllUser, setShowAllUser] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const otherUserId = chatUser?.user?._id || chatUser?._id;

  useEffect(() => {
    if (!loading && !isAuth) router.replace("/(auth)/login");
  }, [isAuth, loading]);

  const fetchChat = useCallback(async () => {
    if (!selectedUser) return;
    try {
      const { data } = await chatService.getMessages(selectedUser);
      setMessages(data.messages);
      setChatUser(data.user);
      await fetchChats();
    } catch (e) {
      console.error("[CHAT][LOAD_MESSAGES_FAILED]", {
        chatId: selectedUser,
        message: getApiErrorMessage(e, "Không tải được tin nhắn"),
      });
      Alert.alert("Lỗi", getApiErrorMessage(e, "Không tải được tin nhắn"));
    }
  }, [fetchChats, selectedUser]);

  async function createChat(u: User) {
    try {
      const { data } = await chatService.create(u._id);
      setSelectedUser(data.chatId);
      setShowAllUser(false);
      await fetchChats();
    } catch (e) {
      console.error("[CHAT][CREATE_FAILED]", {
        otherUserId: u._id,
        message: getApiErrorMessage(e, "Không tạo được chat"),
      });
      Alert.alert("Lỗi", getApiErrorMessage(e, "Không tạo được chat"));
    }
  }

  const handleMessageSend = async (image?: ChatImageUpload) => {
    const text = message.trim();
    if ((!text && !image) || !selectedUser) return false;
    try {
      const { data } = await chatService.sendMessage(selectedUser, text, image);

      setMessages((prev) => {
        const current = prev ? [...prev] : [];
        if (current.some((m) => m._id === data.message._id)) return prev;
        return [...current, data.message];
      });
      setMessage("");
      await fetchChats();
      return true;
    } catch (err: unknown) {
      console.error("[CHAT][SEND_FAILED]", {
        chatId: selectedUser,
        hasText: Boolean(text),
        hasImage: Boolean(image),
        message: getApiErrorMessage(err, "Gửi không thành công"),
      });
      Alert.alert("Lỗi", getApiErrorMessage(err, "Gửi không thành công"));
      return false;
    }
  };

  const handleTyping = (value: string) => {
    setMessage(value);
    if (!selectedUser || !socket || !otherUserId) return;
    socket.emit("typing", { chatId: selectedUser, targetUserId: otherUserId });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typingStop", {
        chatId: selectedUser,
        targetUserId: otherUserId,
      });
      typingTimeoutRef.current = null;
    }, 800);
  };

  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (data: { message: Message }) => {
      if (data.message?.chatId === selectedUser) {
        setMessages((prev) => {
          const current = prev ? [...prev] : [];
          if (current.some((m) => m._id === data.message._id)) return prev;
          return [...current, data.message];
        });
        void fetchChat();
      }
      fetchChats();
    };
    const handleUserTyping = (data: { chatId: string; userId: string }) => {
      if (data.chatId === selectedUser && data.userId === otherUserId)
        setIsTyping(true);
    };
    const handleUserTypingStop = (data: { chatId: string }) => {
      if (data.chatId === selectedUser) setIsTyping(false);
    };
    const handleMessagesSeen = (data: { chatId: string }) => {
      if (data.chatId !== selectedUser) return;
      setMessages((current) =>
        current?.map((item) =>
          item.sender === loggedInUser?._id
            ? { ...item, seen: true, seenAt: new Date().toISOString() }
            : item,
        ) ?? null,
      );
    };
    socket.on("newMessage", handleNewMessage);
    socket.on("userTyping", handleUserTyping);
    socket.on("userTypingStop", handleUserTypingStop);
    socket.on("messagesSeen", handleMessagesSeen);
    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("userTyping", handleUserTyping);
      socket.off("userTypingStop", handleUserTypingStop);
      socket.off("messagesSeen", handleMessagesSeen);
    };
  }, [fetchChat, fetchChats, loggedInUser?._id, socket, selectedUser, otherUserId]);

  useEffect(() => {
    if (selectedUser) fetchChat();
  }, [fetchChat, selectedUser]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <ChatSideBar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        showAllUsers={showAllUser}
        setShowAllUsers={setShowAllUser}
        users={users}
        loggedInUser={loggedInUser}
        chats={chats}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        createChat={createChat}
        onlineUsers={onlineUsers}
      />

      <View style={styles.chatArea}>
        <ChatHeader
          user={chatUser}
          setSidebarOpen={setSidebarOpen}
          isTyping={isTyping}
          otherUserId={otherUserId}
          onlineUsers={onlineUsers}
        />
        <ChatMessages
          selectedUser={selectedUser}
          messages={messages}
          loggedInUser={loggedInUser}
        />
        <MessageInput
          selectedUser={selectedUser}
          message={message}
          setMessage={handleTyping}
          handleMessageSend={handleMessageSend}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  center: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  chatArea: {
    flex: 1,
    padding: 16,
    backgroundColor: "#ffffff",
  },
});
