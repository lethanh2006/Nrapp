/**
 * SocketContext - Kết nối Socket.IO tới backend (giống frontend web)
 */
import { useAppData } from '@/context/AppContext';
import { user_service, chat_service } from '@/constants/api';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: string[];
}

const SocketContext = createContext<SocketContextType>({ socket: null, onlineUsers: [] });

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAppData();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!user?._id) return;

    const newSocket = io(chat_service, {
      query: { userId: user._id },
      transports: ['polling', 'websocket'],
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket error:', err.message);
    });

    newSocket.on('getOnlineUsers', (users: string[]) => {
      setOnlineUsers(users);
    });

    setSocket(newSocket);
    return () => {
      newSocket.disconnect();
    };
  }, [user?._id]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketData = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocketData must be used within SocketProvider');
  return ctx;
};
