import { BASE_URL } from "@/constants/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { createContext, useContext, useEffect, useState } from "react";

const TOKEN_KEY = "token";

export interface User {
  _id: string;
  name: string;
  username?: string;
  email: string;
  role?: "admin" | "user";
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
  role: raw?.role === "admin" ? "admin" : "user",
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
    return AsyncStorage.getItem(TOKEN_KEY);
  };

  async function fetchUser() {
    try {
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      const { data } = await axios.get(`${BASE_URL}/user/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      await AsyncStorage.removeItem(TOKEN_KEY);
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
      const { data } = await axios.get(`${BASE_URL}/chat/chat/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      const { data } = await axios.get(`${BASE_URL}/user/user/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
