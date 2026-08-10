import ChatHeader from "@/src/features/chat/ui/ChatHeader";
import ChatMessages from "@/src/features/chat/ui/ChatMessages";
import ChatSideBar from "@/src/features/chat/ui/ChatSideBar";
import MessageInput from "@/src/features/chat/ui/MessageInput";
import { useAuthSession } from "@/src/features/auth/model/AuthSessionContext";
import { useChatSocket } from "@/src/features/chat/model/ChatSocketContext";
import { getApiErrorMessage } from "@/src/utils/apiHelper";
import { normalizeUser } from "@/src/features/user/model/normalize-user";
import { AppAlert as Alert } from "@/src/shared/ui/AppAlert";
import type {
  ChatImageUpload,
  ChatSummary,
  Message,
} from "@/src/services/chat/constant";
import {
  createChat as createChatRequest,
  getChatMessages,
  getChats,
  sendChatMessage,
} from "@/src/services/chat/chat.service";
import { getAllUsers } from "@/src/services/user/user.service";
import type { User } from "@/src/services/user/constant";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  KeyboardAvoidingView,
  StyleSheet,
  View,
} from "react-native";

const normalizeChatItem = (raw: any): ChatSummary => {
  const rawUser = raw?.user?.user ?? raw?.user ?? raw?.users?.user ?? {};
  const chatData = raw?.chat ?? {};
  return {
    _id: String(raw?._id ?? chatData?._id ?? ""),
    user: normalizeUser(rawUser),
    chat: {
      _id: String(chatData?._id ?? ""),
      users: Array.isArray(chatData?.users)
        ? chatData.users.map(String)
        : [],
      latestMessage:
        chatData?.latestMessage?.text || chatData?.latestMessage?.sender
          ? {
              text: String(chatData.latestMessage.text ?? ""),
              sender: String(chatData.latestMessage.sender ?? ""),
            }
          : null,
      createdAt: String(chatData?.createdAt ?? ""),
      updatedAt: String(chatData?.updatedAt ?? ""),
      unseenCount:
        typeof chatData?.unseenCount === "number" ? chatData.unseenCount : 0,
    },
  };
};

export default function ChatView() {
  const { loading, isAuth, user: loggedInUser, getToken } = useAuthSession();
  const {
    socket,
    onlineUsers,
    isConnected: isRealtimeConnected,
    connectionError: realtimeError,
  } = useChatSocket();

  const [chats, setChats] = useState<ChatSummary[] | null>(null);
  const [users, setUsers] = useState<User[] | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [chatUser, setChatUser] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const otherUserId = chatUser?.user?._id || chatUser?._id;

  const fetchChats = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    const { data } = await getChats(token);
    setChats((data.chats ?? []).map(normalizeChatItem));
  }, [getToken]);

  const fetchUsers = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    const { data } = await getAllUsers(token);
    setUsers((data.users ?? []).map(normalizeUser));
  }, [getToken]);

  useEffect(() => {
    if (!loading && !isAuth) router.replace("/(auth)/login");
  }, [isAuth, loading]);

  useFocusEffect(
    useCallback(() => {
      if (!isAuth) return;
      void Promise.all([fetchUsers(), fetchChats()]);
    }, [fetchChats, fetchUsers, isAuth]),
  );

  const fetchChat = useCallback(async () => {
    if (!selectedUser) return;
    try {
      const token = await getToken();
      if (!token) return;
      const { data } = await getChatMessages(token, selectedUser);
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
  }, [fetchChats, getToken, selectedUser]);

  async function createChat(u: User) {
    try {
      const token = await getToken();
      if (!token) return;
      const { data } = await createChatRequest(token, u._id);
      setSelectedUser(data.chatId);
      await fetchChats();
    } catch (e) {
      console.error("[CHAT][CREATE_FAILED]", {
        otherUserId: u._id,
        message: getApiErrorMessage(e, "Không tạo được chat"),
      });
      Alert.alert("Lỗi", getApiErrorMessage(e, "Không tạo được chat"));
    }
  }

  const emitTypingStop = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (!selectedUser || !socket || !otherUserId) return;
    socket.emit("typingStop", {
      chatId: selectedUser,
      targetUserId: otherUserId,
    });
  }, [otherUserId, selectedUser, socket]);

  const closeChat = useCallback(() => {
    emitTypingStop();
    setSelectedUser(null);
    setChatUser(null);
    setMessages(null);
    setIsTyping(false);
    void fetchChats();
  }, [emitTypingStop, fetchChats]);

  const handleMessageSend = async (image?: ChatImageUpload) => {
    const text = message.trim();
    if ((!text && !image) || !selectedUser) return false;
    try {
      emitTypingStop();
      const token = await getToken();
      if (!token) return false;
      const { data } = await sendChatMessage(
        token,
        selectedUser,
        text,
        image,
      );

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
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (!value.trim()) {
      emitTypingStop();
      return;
    }
    socket.emit("typing", { chatId: selectedUser, targetUserId: otherUserId });
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

  useEffect(() => {
    if (!selectedUser) return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      closeChat();
      return true;
    });
    return () => subscription.remove();
  }, [closeChat, selectedUser]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!selectedUser) {
    return (
      <ChatSideBar
        users={users}
        loggedInUser={loggedInUser}
        chats={chats}
        setSelectedUser={setSelectedUser}
        createChat={createChat}
        refreshUsers={async () => {
          await Promise.all([fetchUsers(), fetchChats()]);
        }}
        onlineUsers={onlineUsers}
        isRealtimeConnected={isRealtimeConnected}
        hasRealtimeError={Boolean(realtimeError)}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <View style={styles.chatArea}>
        <ChatHeader
          user={chatUser}
          onBack={closeChat}
          isTyping={isTyping}
          otherUserId={otherUserId}
          onlineUsers={onlineUsers}
          isRealtimeConnected={isRealtimeConnected}
          hasRealtimeError={Boolean(realtimeError)}
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
