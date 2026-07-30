import { SOCKET_PATH, SOCKET_URL } from "@/constants/api";
import { useAppData } from "@/context/AppContext";
import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: string[];
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  onlineUsers: [],
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { getToken, user } = useAppData();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  useEffect(() => {
    if (!user?._id) return;

    let newSocket: Socket | null = null;
    let cancelled = false;

    const connect = async () => {
      const token = await getToken();
      if (!token || cancelled) return;
      newSocket = io(SOCKET_URL, {
        path: SOCKET_PATH,
        auth: { token },
        transports: ["websocket", "polling"],
      });

      newSocket.on("connect_error", (err) => {
        console.error("Socket error:", err.message);
      });

      newSocket.on("getOnlineUsers", (users: string[]) => {
        setOnlineUsers(users);
      });

      setSocket(newSocket);
    };
    connect();

    return () => {
      cancelled = true;
      newSocket?.disconnect();
      setSocket(null);
      setOnlineUsers([]);
    };
  }, [getToken, user?._id]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketData = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocketData must be used within SocketProvider");
  return ctx;
};
