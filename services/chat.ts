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

export interface ChatImageUpload {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}

export const chatService = {
  create: (otherUserId: string) =>
    apiClient.post<{ message: string; chatId: string }>(
      API_ENDPOINTS.chat.create,
      { otherUserId },
    ),
  getAll: () =>
    apiClient.get<{ chats: ChatListItem[] }>(API_ENDPOINTS.chat.all),
  sendMessage: async (chatId: string, text: string, image?: ChatImageUpload) => {
    if (__DEV__) {
      console.log("[CHAT][SEND_START]", {
        chatId,
        hasText: Boolean(text),
        hasImage: Boolean(image),
        imageType: image?.mimeType,
      });
    }
    const form = new FormData();
    form.append("chatId", chatId);
    if (text) form.append("text", text);
    if (image) {
      if (typeof document !== "undefined") {
        const blob = await (await fetch(image.uri)).blob();
        form.append("image", blob, image.fileName || "chat-image.jpg");
      } else {
        form.append("image", {
          uri: image.uri,
          name: image.fileName || "chat-image.jpg",
          type: image.mimeType || "image/jpeg",
        } as unknown as Blob);
      }
    }
    const response = await apiClient.post<{ message: Message; sender: string }>(
      API_ENDPOINTS.chat.message,
      form,
    );
    if (__DEV__) {
      console.log("[CHAT][SEND_SUCCESS]", {
        chatId,
        messageId: response.data.message._id,
        messageType: response.data.message.messageType,
      });
    }
    return response;
  },
  getMessages: (chatId: string) =>
    apiClient.get<{ messages: Message[]; user: { user?: ChatUser } | ChatUser }>(
      API_ENDPOINTS.chat.messages(chatId),
    ),
};
