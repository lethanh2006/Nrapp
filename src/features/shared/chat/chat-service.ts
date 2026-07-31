import type { Message } from "@/types/chat";
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

export interface ChatService {
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

