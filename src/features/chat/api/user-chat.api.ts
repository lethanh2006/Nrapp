import { createChatApi } from "@/src/features/chat/api/create-chat-api";
import { API_ENDPOINTS } from "@/src/api/endpoints";

export const userChatApi = createChatApi(API_ENDPOINTS.chat);
