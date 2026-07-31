import { API_ENDPOINTS } from "@/services/api";
import { createChatService } from "@/src/features/shared/chat/create-chat-service";

export const userChatService = createChatService(API_ENDPOINTS.user.chat);

