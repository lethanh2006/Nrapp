import { apiClient } from "@/services/api";
import type {
  ChatImageUpload,
  ChatListItem,
  ChatService,
  ChatUser,
} from "@/src/features/shared/chat/chat-service";
import type { Message } from "@/types/chat";

export interface ChatEndpoints {
  all: string;
  create: string;
  message: string;
  messages(chatId: string): string;
}

export const createChatService = (endpoints: ChatEndpoints): ChatService => ({
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

