"use client";

import { ReactNode, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { BACKEND_URL } from "@/lib/env";
import { AppSocket } from "@/types/socket";
import { AuthService } from "@/lib/auth-service";

interface DirectMessage {
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

        // Direct messaging - receive messages from other users
        s.on("directMessage", (msg: any) => {
            // Only process messages with a type field (ignore duplicates without type)
            if (!msg.type) {
                return;
            }
            
            const content = msg.content || msg.message || (typeof msg === 'string' ? msg : '');
            
            // Handle different message types
            if (msg.type === 'private') {
                // Incoming message from another user
                const message: DirectMessage = {
                    id: Date.now().toString(),
                    content: content,
                    from: msg.sender || 'Unknown',
                    to: '',
                    timestamp: msg.timestamp || new Date().toISOString(),
                    isSent: false,
                    message: content
                };
                setDirectMessages((prev) => [...prev, message]);
            } else if (msg.type === 'private-sent') {
                // Backend confirmation - we already showed this optimistically, so skip
            }
        });

        // Listen for room events
        s.on("joinedRoom", (room: string) => {
            addMessage(`[System] Joined room: ${room}`);
        });

        s.on("leftRoom", (room: string) => {
            addMessage(`[System] Left room: ${room}`);
        });

        s.on("error", (error: any) => {
            const errorMsg = typeof error === 'string' ? error : error.message || 'Unknown error';
            const errorCode = typeof error === 'object' ? error.code : null;
            
            // Silently ignore USER_NOT_FOUND and USER_OFFLINE for direct messages
            // The optimistic UI update already shows the message
            if (errorCode === 'USER_NOT_FOUND' || errorCode === 'USER_OFFLINE') {
                // Backend bug - ignore silently
                return;
            }
            
            // Only show other errors
            addMessage(`[Error] ${errorMsg}`);
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

    return {
        socket,
        socketId,
        isConnected,
        messages,
        directMessages,
        addMessage,
    };
}
