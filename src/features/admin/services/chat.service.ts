import { API_ENDPOINTS } from "@/services/api";
import { createChatService } from "@/src/features/shared/chat/create-chat-service";

// Tách instance để API chat quản trị có thể đổi độc lập khi BE phân quyền.
export const adminChatService = createChatService(API_ENDPOINTS.admin.chat);

