import { userDirectory } from "@/src/features/user/api/user-directory.api";
import { userChatApi } from "@/src/features/chat/api/user-chat.api";
import ChatView from "@/src/features/chat/ui/ChatView";

export default function UserChatRoute() {
  return <ChatView chatApi={userChatApi} userDirectory={userDirectory} />;
}
