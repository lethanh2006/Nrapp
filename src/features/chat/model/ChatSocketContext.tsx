import { socketPath, socketUrl } from "@/src/utils/ip";
import { useAuthSession } from "@/src/features/auth/model/AuthSessionContext";
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

export const ChatSocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { getToken, user } = useAuthSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  useEffect(() => {
    if (!user?._id) return;

    let newSocket: Socket | null = null;
    let cancelled = false;

    const connect = async () => {
      const token = await getToken();
      if (!token || cancelled) return;
      newSocket = io(socketUrl, {
        path: socketPath,
        auth: { token },
        transports: ["websocket", "polling"],
      });

      newSocket.on("connect_error", (err) => {
        console.error("[CHAT][SOCKET_ERROR]", { message: err.message });
      });

      newSocket.on("connect", () => {
        console.log("[CHAT][SOCKET_CONNECTED]", { socketId: newSocket?.id });
      });

      newSocket.on("disconnect", (reason) => {
        console.log("[CHAT][SOCKET_DISCONNECTED]", { reason });
      });

      newSocket.on("getOnlineUsers", (users: string[]) => {
        console.log("[CHAT][ONLINE_USERS]", { count: users.length, users });
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

export const useChatSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useChatSocket must be used within ChatSocketProvider");
  return ctx;
};
