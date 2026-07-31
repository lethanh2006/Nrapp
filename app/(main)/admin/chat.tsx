import { adminUserDirectory } from "@/src/features/user/api/user-directory.api";
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
