import { adminUserDirectory } from "@/src/entities/user/api/admin-user-directory.api";
import { adminChatApi } from "@/src/features/chat/api/admin-chat.api";
import ChatView from "@/src/features/chat/ui/ChatView";

export default function AdminChatRoute() {
  return (
    <ChatView
      chatApi={adminChatApi}
      userDirectory={adminUserDirectory}
    />
  );
}
