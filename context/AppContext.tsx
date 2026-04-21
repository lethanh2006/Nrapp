/**
 * AppContext - Quản lý auth, user, chats (giống frontend web)
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { user_service, chat_service } from '@/constants/api';

const TOKEN_KEY = 'token';

export interface User {
  _id: string;
  name: string;
  email: string;
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

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
      const { data } = await axios.get(`${user_service}/api/v1/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = data.user || data;
      setUser(userData);
      setIsAuth(true);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function logoutUser() {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setIsAuth(false);
  }

  async function fetchChats() {
    const token = await getToken();
    if (!token) return;
    try {
      const { data } = await axios.get(`${chat_service}/api/v1/chat/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChats(data.chats);
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchUsers() {
    const token = await getToken();
    if (!token) return;
    try {
      const { data } = await axios.get(`${user_service}/api/v1/user/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (Array.isArray(data)) setUsers(data);
      else if (data?.users) setUsers(data.users);
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
  if (!ctx) throw new Error('useAppData must be used within AppProvider');
  return ctx;
};
