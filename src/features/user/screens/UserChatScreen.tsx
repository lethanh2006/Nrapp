import ChatScreen from "@/src/features/shared/chat/screens/ChatScreen";
import { userChatService } from "@/src/features/user/services/chat.service";
import { userDirectory } from "@/src/features/user/services/user-directory.service";

export default function UserChatScreen() {
  return (
    <ChatScreen chatService={userChatService} userDirectory={userDirectory} />
  );
}
