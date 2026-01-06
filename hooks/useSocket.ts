"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { BACKEND_URL } from "@/lib/env";
import { AppSocket } from "@/types/socket";
import { AuthService } from "@/lib/auth-service";

interface DirectMessage {
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

    const addMessage = (msg: string) => {
        setMessages((prev) => [...prev, msg]);
    };

    useEffect(() => {
        const token = AuthService.getAccessToken();
        
        const s: AppSocket = io(BACKEND_URL, { 
            transports: ["websocket"],
            auth: { token }
        });
        setSocket(s);

        s.on("connect", () => {
            setSocketId(s.id ?? "");
            setIsConnected(true);
        });

        s.on("disconnect", () => setIsConnected(false));

        // Room messaging
        s.on("message", (msg: any) => {
            const text = typeof msg === 'string' ? msg : msg.content || JSON.stringify(msg);
            addMessage(text);
        });
        
        s.on("roomMessage", (msg: any) => {
            const text = typeof msg === 'string' ? msg : msg.content || JSON.stringify(msg);
            addMessage(text);
        });

        s.on("joinedRoom", (room: string) => {
            addMessage(`[System] Joined room: ${room}`);
        });

        s.on("leftRoom", (room: string) => {
            addMessage(`[System] Left room: ${room}`);
        });

        // Direct messaging
        s.on("directMessage", (msg: any) => {
            if (msg.from === s.id) return;
            
            const message: DirectMessage = {
                id: Date.now().toString(),
                content: msg.content || msg.message || msg,
                from: msg.from || 'Unknown',
                to: s.id || '',
                timestamp: msg.timestamp || new Date().toISOString(),
                isSent: false
            };
            setDirectMessages((prev) => [...prev, message]);
        });

        s.on("error", (error: string) => {
            addMessage(`[Error] ${error}`);
        });

        s.on("connect_error", async (error) => {
            if (error.message === "Unauthorized") {
                try {
                    const newToken = await AuthService.refreshToken();
                    s.auth = { token: newToken };
                    s.connect();
                } catch {
                    window.location.href = '/login';
                }
            }
        });

        return () => {
            s.disconnect();
        };
    }, []);

    const sendDirectMessage = (targetId: string, message: string) => {
        if (!socket || !isConnected) return;

        socket.emit("directMessage", { targetId, message });

        const dm: DirectMessage = {
            id: Date.now().toString(),
            content: message,
            from: socketId,
            to: targetId,
            timestamp: new Date().toISOString(),
            isSent: true
        };

        setDirectMessages((prev) => [...prev, dm]);
    };

    return {
        socket,
        socketId,
        isConnected,
        messages,
        directMessages,
        sendDirectMessage,
        addMessage,
    };
}
