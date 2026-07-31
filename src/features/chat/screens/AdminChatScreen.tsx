import ChatScreen from "@/src/features/chat/screens/ChatScreen";
import { adminChatApi } from "@/src/features/chat/api/admin-chat.api";
import { adminUserDirectory } from "@/src/entities/user/api/admin-user-directory.api";

export default function AdminChatScreen() {
  return (
    <ChatScreen
      chatApi={adminChatApi}
      userDirectory={adminUserDirectory}
    />
  );
}
