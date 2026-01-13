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
            console.log("[useSocket] Room message received:", msg);
            let text: string;
            if (typeof msg === 'string') {
                text = msg;
            } else if (msg.type === 'room') {
                text = `[${msg.sender}]: ${msg.content}`;
            } else if (msg.type === 'system') {
                text = `[System] ${msg.content}`;
            } else {
                text = msg.content || JSON.stringify(msg);
            }
            addMessage(text);
        });

        s.on("directMessage", (msg: any) => {
            console.log("[useSocket] Direct message received:", msg);
            let text: string;
            if (typeof msg === 'string') {
                text = msg;
            } else if (msg.type === 'private-sent') {
                // Message sent by current user
                text = `[To ${msg.targetUsername}]: ${msg.content}`;
            } else if (msg.type === 'private') {
                // Message received from another user
                text = `[From ${msg.sender}]: ${msg.content}`;
            } else {
                text = msg.content || JSON.stringify(msg);
            }
            setDirectMessages((prev) => [...prev, text]);
        });

        // Listen for room events
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

        s.on("error", (error: any) => {
            console.error("[useSocket] Socket error:", error);
            const errorMsg = typeof error === 'string' ? error : error.message || 'Unknown error';
            const errorCode = typeof error === 'object' ? error.code : null;
            
            // Display different messages based on error code
            if (errorCode === 'USER_NOT_FOUND') {
                addMessage(`[Error] ${errorMsg}`);
                alert(`❌ ${errorMsg}`);
            } else if (errorCode === 'USER_OFFLINE') {
                addMessage(`[Error] ${errorMsg}`);
                alert(`⚠️ ${errorMsg}`);
            } else {
                addMessage(`[Error] ${errorMsg}`);
            }
        });
        
        // Handle authentication errors
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
