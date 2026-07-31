import axios from "@/src/utils/axios";
import { getAuthHeader } from "@/src/utils/apiHelper";
import { ipNR } from "@/src/utils/ip";
import type { Message } from "@/src/features/chat/model/message.types";

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

type ChatRecord = {
  _id: string;
  users: string[];
  latestMessage: { text: string; sender: string } | null;
  createdAt: string;
  updatedAt: string;
  unseenCount: number;
};

type ChatListItem = {
  user: { user?: ChatUser } | ChatUser;
  chat: ChatRecord;
};

async function createMessagePayload(
  chatId: string,
  text: string,
  image?: ChatImageUpload,
) {
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
}

export async function createChat(token: string, otherUserId: string) {
  return axios.post<{ message: string; chatId: string }>(
    `${ipNR}/chat/chat/new`,
    { otherUserId },
    getAuthHeader(token),
  );
}

export async function getChats(token: string) {
  return axios.get<{ chats: ChatListItem[] }>(
    `${ipNR}/chat/chat/all`,
    getAuthHeader(token),
  );
}

export async function sendChatMessage(
  token: string,
  chatId: string,
  text: string,
  image?: ChatImageUpload,
) {
  return axios.post<{ message: Message; sender: string }>(
    `${ipNR}/chat/message`,
    await createMessagePayload(chatId, text, image),
    getAuthHeader(token),
  );
}

export async function getChatMessages(token: string, chatId: string) {
  return axios.get<{
    messages: Message[];
    user: { user?: ChatUser } | ChatUser;
  }>(
    `${ipNR}/chat/message/${encodeURIComponent(chatId)}`,
    getAuthHeader(token),
  );
}
