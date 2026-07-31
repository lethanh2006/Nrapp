import ChatScreen from "@/src/features/chat/screens/ChatScreen";
import { userChatApi } from "@/src/features/chat/api/user-chat.api";
import { userDirectory } from "@/src/entities/user/api/user-directory.api";

export default function UserChatScreen() {
  return (
    <ChatScreen chatApi={userChatApi} userDirectory={userDirectory} />
  );
}
