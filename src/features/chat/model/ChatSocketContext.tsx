import { socketPath, socketUrl } from "@/src/utils/ip";
import { useAuthSession } from "@/src/features/auth/model/AuthSessionContext";
import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: string[];
  isConnected: boolean;
  connectionError: string | null;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  onlineUsers: [],
  isConnected: false,
  connectionError: null,
});

export const ChatSocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { getToken, user } = useAuthSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  useEffect(() => {
    if (!user?._id) return;

    let newSocket: Socket | null = null;
    let cancelled = false;

    const connect = async () => {
      try {
        const token = await getToken();
        if (!token || cancelled) return;
        newSocket = io(socketUrl, {
          path: socketPath,
          auth: { token },
          transports: ["websocket", "polling"],
          autoConnect: false,
        });

        newSocket.on("connect_error", (err) => {
          setIsConnected(false);
          setConnectionError(err.message);
          console.error("[CHAT][SOCKET_ERROR]", { message: err.message });
        });

        newSocket.on("connect", () => {
          setIsConnected(true);
          setConnectionError(null);
          console.log("[CHAT][SOCKET_CONNECTED]", { socketId: newSocket?.id });
        });

        newSocket.on("disconnect", (reason) => {
          setIsConnected(false);
          console.log("[CHAT][SOCKET_DISCONNECTED]", { reason });
        });

        newSocket.on("getOnlineUsers", (users: string[]) => {
          const normalizedUsers = Array.isArray(users) ? users.map(String) : [];
          console.log("[CHAT][ONLINE_USERS]", { count: normalizedUsers.length });
          setOnlineUsers(normalizedUsers);
        });

        setSocket(newSocket);
        newSocket.connect();
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Không thể kết nối realtime";
        setConnectionError(message);
        console.error("[CHAT][SOCKET_INIT_FAILED]", { message });
      }
    };
    void connect();

    return () => {
      cancelled = true;
      newSocket?.disconnect();
      setSocket(null);
      setOnlineUsers([]);
      setIsConnected(false);
      setConnectionError(null);
    };
  }, [getToken, user?._id]);

  return (
    <SocketContext.Provider
      value={{ socket, onlineUsers, isConnected, connectionError }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useChatSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useChatSocket must be used within ChatSocketProvider");
  return ctx;
};
