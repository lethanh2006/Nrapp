import type { User } from "@/src/features/user/model/user.types";

export interface Chat {
  _id: string;
  users: string[];
  latestMessage: {
    text: string;
    sender: string;
  };
  createdAt: string;
  updatedAt: string;
  unseenCount?: number;
}

export interface ChatSummary {
  _id: string;
  user: User;
  chat: Chat;
}
