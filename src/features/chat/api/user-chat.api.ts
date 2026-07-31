import { createChatApi } from "@/src/features/chat/api/create-chat-api";

export const userChatApi = createChatApi({
  all: "/chat/chat/all",
  create: "/chat/chat/new",
  message: "/chat/message",
  messages: (chatId) => `/chat/message/${encodeURIComponent(chatId)}`,
});
