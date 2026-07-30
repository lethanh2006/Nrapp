import { authService } from "@/services/auth";
import { API_ENDPOINTS, apiClient } from "@/services/api";
import React, { createContext, useContext, useEffect, useState } from "react";

export interface User {
  _id: string;
  name: string;
  username?: string;
  email: string;
  role?: "admin" | "manager" | "user";
}

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

export interface Chats {
  _id: string;
  user: User;
  chat: Chat;
}

interface AppContextType {
  user: User | null;
  loading: boolean;
  isAuth: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setIsAuth: React.Dispatch<React.SetStateAction<boolean>>;
  logoutUser: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  fetchChats: () => Promise<void>;
  chats: Chats[] | null;
  users: User[] | null;
  setChats: React.Dispatch<React.SetStateAction<Chats[] | null>>;
  getToken: () => Promise<string | null>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const normalizeUser = (raw: any): User => ({
  _id: String(raw?._id ?? ""),
  name: String(raw?.name ?? raw?.username ?? raw?.email ?? "Unknown"),
  username: raw?.username ? String(raw.username) : undefined,
  email: String(raw?.email ?? ""),
  role:
    raw?.role === "admin" || raw?.role === "manager" ? raw.role : "user",
});

const normalizeChatItem = (raw: any): Chats => {
  const rawUser = raw?.user?.user ?? raw?.user ?? raw?.users?.user ?? {};
  const chatData = raw?.chat ?? {};
  return {
    _id: String(raw?._id ?? chatData?._id ?? ""),
    user: normalizeUser(rawUser),
    chat: {
      _id: String(chatData?._id ?? ""),
      users: Array.isArray(chatData?.users)
        ? chatData.users.map((id: any) => String(id))
        : [],
      latestMessage: {
        text: String(chatData?.latestMessage?.text ?? ""),
        sender: String(chatData?.latestMessage?.sender ?? ""),
      },
      createdAt: String(chatData?.createdAt ?? ""),
      updatedAt: String(chatData?.updatedAt ?? ""),
      unseenCount:
        typeof chatData?.unseenCount === "number" ? chatData.unseenCount : 0,
    },
  };
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<Chats[] | null>(null);
  const [users, setUsers] = useState<User[] | null>(null);

  const getToken = async () => {
    return authService.getToken();
  };

  async function fetchUser() {
    try {
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      const { data } = await apiClient.get(API_ENDPOINTS.user.me);
      const userData = data.user || data;
      setUser(normalizeUser(userData));
      setIsAuth(true);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function logoutUser() {
    try {
      await authService.clearSession();
    } catch {
      // keep UI consistent even if storage operation fails
    } finally {
      setUser(null);
      setIsAuth(false);
      setChats(null);
      setUsers(null);
      setLoading(false);
    }
  }

  async function fetchChats() {
    const token = await getToken();
    if (!token) return;
    try {
      const { data } = await apiClient.get(API_ENDPOINTS.chat.all);
      const rawChats = Array.isArray(data?.chats) ? data.chats : [];
      setChats(rawChats.map(normalizeChatItem));
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchUsers() {
    const token = await getToken();
    if (!token) return;
    try {
      const { data } = await apiClient.get(API_ENDPOINTS.user.all);
      if (Array.isArray(data)) setUsers(data.map(normalizeUser));
      else if (data?.users) setUsers(data.users.map(normalizeUser));
      else setUsers([]);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (isAuth) {
      fetchChats();
      fetchUsers();
    }
  }, [isAuth]);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        isAuth,
        setIsAuth,
        loading,
        logoutUser,
        fetchChats,
        fetchUsers,
        chats,
        users,
        setChats,
        getToken,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppData = (): AppContextType => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppData must be used within AppProvider");
  return ctx;
};
