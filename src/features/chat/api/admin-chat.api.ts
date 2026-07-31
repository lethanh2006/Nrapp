import { createChatApi } from "@/src/features/chat/api/create-chat-api";
import { API_ENDPOINTS } from "@/src/api/endpoints";

// Tách instance để API chat quản trị có thể đổi độc lập khi BE phân quyền.
export const adminChatApi = createChatApi(API_ENDPOINTS.chat);
