import { userApi } from "@/src/api/user.api";
import { userChatApi } from "@/src/api/chat.api";
import ChatView from "@/src/features/chat/ui/ChatView";

export default function UserChatRoute() {
  return <ChatView chatApi={userChatApi} userDirectory={userApi} />;
}
