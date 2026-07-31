import { userApi } from "@/src/api/user.api";
import { adminChatApi } from "@/src/api/chat.api";
import ChatView from "@/src/features/chat/ui/ChatView";

export default function AdminChatRoute() {
  return (
    <ChatView
      chatApi={adminChatApi}
      userDirectory={userApi}
    />
  );
}
