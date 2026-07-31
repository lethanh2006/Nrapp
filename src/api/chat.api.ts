import { apiClient } from "@/src/api/client";
import type { Message } from "@/src/features/chat/model/message.types";
import type { AxiosResponse } from "axios";

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

export interface ChatApi {
  create(otherUserId: string): Promise<AxiosResponse<{ message: string; chatId: string }>>;
  getAll(): Promise<AxiosResponse<{ chats: ChatListItem[] }>>;
  sendMessage(
    chatId: string,
    text: string,
    image?: ChatImageUpload,
  ): Promise<AxiosResponse<{ message: Message; sender: string }>>;
  getMessages(
    chatId: string,
  ): Promise<AxiosResponse<{ messages: Message[]; user: { user?: ChatUser } | ChatUser }>>;
}

const createMessagePayload = async (
  chatId: string,
  text: string,
  image?: ChatImageUpload,
) => {
  if (!image) return { chatId, text };

  const form = new FormData();
  form.append("chatId", chatId);
  if (text) form.append("text", text);

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

  return form;
};

export const chatApi: ChatApi = {
  create: (otherUserId) =>
    apiClient.post("/chat/chat/new", { otherUserId }),

  getAll: () => apiClient.get("/chat/chat/all"),

  sendMessage: async (chatId, text, image) =>
    apiClient.post(
      "/chat/message",
      await createMessagePayload(chatId, text, image),
    ),

  getMessages: (chatId) =>
    apiClient.get(`/chat/message/${encodeURIComponent(chatId)}`),
};

// Hiện backend dùng cùng endpoint cho admin và user.
export const adminChatApi = chatApi;
export const userChatApi = chatApi;
