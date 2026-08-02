import type { User } from "@/src/services/user/constant";

export interface ChatUser {
  _id: string;
  username?: string;
  email?: string;
  role?: string;
  name?: string;
}

export interface ChatImageUpload {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
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

export interface Chat {
  _id: string;
  users: string[];
  latestMessage: {
    text: string;
    sender: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  unseenCount?: number;
}

export interface ChatSummary {
  _id: string;
  user: User;
  chat: Chat;
}

export interface Message {
  _id: string;
  chatId: string;
  sender: string;
  text?: string;
  image?: { url: string; publicId: string };
  messageType: "text" | "image";
  seen: boolean;
  seenAt?: string;
  createdAt: string;
}
