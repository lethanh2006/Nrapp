import ChatScreen from "@/src/features/shared/chat/screens/ChatScreen";
import { adminChatService } from "@/src/features/admin/services/chat.service";
import { adminUserDirectory } from "@/src/features/admin/services/user-directory.service";

export default function AdminChatScreen() {
  return (
    <ChatScreen
      chatService={adminChatService}
      userDirectory={adminUserDirectory}
    />
  );
}
