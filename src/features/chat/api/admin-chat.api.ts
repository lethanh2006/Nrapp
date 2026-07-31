import { createChatApi } from "@/src/features/chat/api/create-chat-api";

// Tách instance để API chat quản trị có thể đổi độc lập khi BE phân quyền.
export const adminChatApi = createChatApi({
  all: "/chat/chat/all",
  create: "/chat/chat/new",
  message: "/chat/message",
  messages: (chatId) => `/chat/message/${encodeURIComponent(chatId)}`,
});
