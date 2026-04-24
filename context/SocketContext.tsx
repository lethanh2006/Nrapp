import { BASE_URL } from "@/constants/api";
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
  const { user } = useAppData();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const socketUrl = BASE_URL.replace(/\/api\/?$/, "");

  console.log("[Socket] Connecting to:", socketUrl);

  useEffect(() => {
    if (!user?._id) return;

    const newSocket = io(socketUrl, {
      path: "/socket.io",
      query: { userId: user._id },
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket error:", err.message);
    });

    newSocket.on("getOnlineUsers", (users: string[]) => {
      setOnlineUsers(users);
    });

    setSocket(newSocket);
    return () => {
      newSocket.disconnect();
    };
  }, [user?._id, socketUrl]);

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
