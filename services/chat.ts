import { API_ENDPOINTS, apiClient } from "@/services/api";
import type { Message } from "@/types/chat";

export interface ChatUser {
  _id: string;
  username?: string;
  email?: string;
  role?: string;
  name?: string;
}

export interface ChatRecord {
  _id: string;
  users: string[];
  latestMessage: { text: string; sender: string } | null;
  createdAt: string;
  updatedAt: string;
  unseenCount: number;
}

export interface ChatListItem {
  user: { user?: ChatUser } | ChatUser;
  chat: ChatRecord;
}

export const chatService = {
  create: (otherUserId: string) =>
    apiClient.post<{ message: string; chatId: string }>(
      API_ENDPOINTS.chat.create,
      { otherUserId },
    ),
  getAll: () =>
    apiClient.get<{ chats: ChatListItem[] }>(API_ENDPOINTS.chat.all),
  sendText: (chatId: string, text: string) =>
    apiClient.post<{ message: Message; sender: string }>(
      API_ENDPOINTS.chat.message,
      { chatId, text },
    ),
  getMessages: (chatId: string) =>
    apiClient.get<{ messages: Message[]; user: { user?: ChatUser } | ChatUser }>(
      API_ENDPOINTS.chat.messages(chatId),
    ),
};
