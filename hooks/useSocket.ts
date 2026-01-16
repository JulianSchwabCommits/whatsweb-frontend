"use client";

import { ReactNode, useEffect, useState, useCallback } from "react";
import { AppSocket } from "@/types/socket";
import { AuthService } from "@/lib/auth-service";
import { chatService } from "@/lib/chat-service";
import { toast } from "sonner";

export interface DirectMessage {
  message: ReactNode;
  id: string;
  content: string;
  from: string;
  to: string;
  timestamp: string;
  isSent: boolean;
}

export function useSocket() {
  const [socket, setSocket] = useState<AppSocket | null>(null);
  const [socketId, setSocketId] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);

  const addMessage = useCallback((msg: string) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  // Poll until socket becomes available
  useEffect(() => {
    const checkSocket = () => {
      const s = chatService.getSocket() as AppSocket;
      if (s && s !== socket) {
        setSocket(s);
        setIsConnected(s.connected);
        setSocketId(s.id ?? "");
      }
    };

    checkSocket();
    const interval = setInterval(checkSocket, 500);
    return () => clearInterval(interval);
  }, [socket]);

  // Setup socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      setSocketId(socket.id ?? "");
      setIsConnected(true);
    };

    const handleDisconnect = () => setIsConnected(false);

    const handleRoomMessage = (msg: any) => {
      let text: string;
      if (typeof msg === "string") text = msg;
      else if (msg.type === "room") text = `[${msg.sender}]: ${msg.content}`;
      else if (msg.type === "system") text = `[System] ${msg.content}`;
      else text = msg.content || JSON.stringify(msg);

      addMessage(text);
    };

    const handleDirectMessage = (msg: any) => {
      if (!msg.type) return;

      const content = msg.content || msg.message || (typeof msg === "string" ? msg : "");
      if (msg.type === "private") {
        const dm: DirectMessage = {
          id: Date.now().toString(),
          content,
          from: msg.sender || "Unknown",
          to: "",
          timestamp: msg.timestamp || new Date().toISOString(),
          isSent: false,
          message: content,
        };
        setDirectMessages(prev => [...prev, dm]);
      }
      // private-sent is ignored (optimistic update)
    };

    const handleRoomEvents = (event: "joinedRoom" | "leftRoom", room: string) => {
      const text = `[System] ${event === "joinedRoom" ? "Joined" : "Left"} room: ${room}`;
      addMessage(text);
    };

    const handleError = (error: any) => {
      const errorMsg = typeof error === "string" ? error : error.message || "Unknown error";
      const errorCode = typeof error === "object" ? error.code : null;

      if (["USER_NOT_FOUND", "USER_OFFLINE"].includes(errorCode)) return;

      if (errorCode === "AUTHENTICATION_FAILED") {
        toast.error("Authentication failed", {
          description: errorMsg,
          action: { label: "Login", onClick: () => (window.location.href = "/login") },
        });
      } else if (errorCode === "INVALID_ROOM") {
        toast.error("Invalid room", { description: errorMsg });
      } else if (errorCode === "RATE_LIMIT") {
        toast.warning("Rate limit exceeded", { description: errorMsg });
      } else {
        toast.error("Error", { description: errorMsg });
      }

      addMessage(`[Error] ${errorMsg}`);
    };

    const handleConnectError = async (error: any) => {
      if (error.message === "Unauthorized") {
        try {
          const newToken = await AuthService.refreshToken();
          socket.auth = { token: newToken };
          socket.connect();
        } catch {
          toast.error("Session expired", {
            description: "Please login again to continue",
            action: { label: "Login", onClick: () => (window.location.href = "/login") },
          });
          setTimeout(() => (window.location.href = "/login"), 2000);
        }
      } else {
        toast.error("Connection failed", {
          description: error.message || "Unable to connect to server",
        });
      }
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("message", handleRoomMessage);
    socket.on("directMessage", handleDirectMessage);
    socket.on("joinedRoom", (room: string) => handleRoomEvents("joinedRoom", room));
    socket.on("leftRoom", (room: string) => handleRoomEvents("leftRoom", room));
    socket.on("error", handleError);
    socket.on("connect_error", handleConnectError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("message", handleRoomMessage);
      socket.off("directMessage", handleDirectMessage);
      socket.off("joinedRoom");
      socket.off("leftRoom");
      socket.off("error", handleError);
      socket.off("connect_error", handleConnectError);
    };
  }, [socket, addMessage]);

  return { socket, socketId, isConnected, messages, directMessages, addMessage };
}
