import { apiClient } from "@/src/shared/api/http-client";
import type {
  ChatImageUpload,
  ChatListItem,
  ChatApi,
  ChatUser,
} from "@/src/features/chat/api/chat-api.types";
import type { Message } from "@/src/features/chat/model/message.types";

export interface ChatEndpoints {
  all: string;
  create: string;
  message: string;
  messages(chatId: string): string;
}

export const createChatApi = (endpoints: ChatEndpoints): ChatApi => ({
  create: (otherUserId) =>
    apiClient.post<{ message: string; chatId: string }>(endpoints.create, {
      otherUserId,
    }),
  getAll: () =>
    apiClient.get<{ chats: ChatListItem[] }>(endpoints.all),
  sendMessage: async (chatId, text, image?: ChatImageUpload) => {
    let payload: FormData | { chatId: string; text: string };

    if (image) {
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
      payload = form;
    } else {
      payload = { chatId, text };
    }

    return apiClient.post<{ message: Message; sender: string }>(
      endpoints.message,
      payload,
    );
  },
  getMessages: (chatId) =>
    apiClient.get<{
      messages: Message[];
      user: { user?: ChatUser } | ChatUser;
    }>(endpoints.messages(chatId)),
});
