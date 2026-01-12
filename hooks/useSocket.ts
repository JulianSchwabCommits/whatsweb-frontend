"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { BACKEND_URL } from "@/lib/env";
import { AppSocket } from "@/types/socket";
import { AuthService } from "@/lib/auth-service";

export function useSocket() {
    const [socket, setSocket] = useState<AppSocket | null>(null);
    const [socketId, setSocketId] = useState("");
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState<string[]>([]);
    const [directMessages, setDirectMessages] = useState<string[]>([]);
    
    const addMessage = (msg: string) => {
        console.log("[useSocket] Adding message to UI:", msg);
        setMessages((prev) => [...prev, msg]);
    };

    useEffect(() => {
        const token = AuthService.getAccessToken();
        
        console.log("[useSocket] Initializing socket with token:", token ? "present" : "null");
        
        const s: AppSocket = io(BACKEND_URL, { 
            transports: ["websocket"],
            auth: {
                token: token,
            }
        });
        setSocket(s);

        s.on("connect", () => {
            console.log("[useSocket] Connected with ID:", s.id);
            setSocketId(s.id ?? "");
            setIsConnected(true);
        });

        s.on("disconnect", (reason) => {
            console.log("[useSocket] Disconnected:", reason);
            setIsConnected(false);
        });
        
        // Listen for ALL events to debug
        s.onAny((eventName, ...args) => {
            console.log(`[Socket Event] ${eventName}:`, args);
        });

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
            const text = typeof msg === 'string' ? msg : msg.content || JSON.stringify(msg);
            setDirectMessages((prev) => [...prev, text]);
        });

        // Listen for room events
        s.on("joinedRoom", (room: string) => {
            console.log("[useSocket] Successfully joined room:", room);
            addMessage(`[System] Joined room: ${room}`);
        });

        s.on("leftRoom", (room: string) => {
            console.log("[useSocket] Left room:", room);
            addMessage(`[System] Left room: ${room}`);
        });

        s.on("error", (error: string) => {
            console.error("[useSocket] Socket error:", error);
            addMessage(`[Error] ${error}`);
        });
        
        s.on("exception", (error) => {
            console.error("[useSocket] Socket exception:", error);
            alert(`Error: ${error.message || 'Unknown error'}`);
        });

        // Handle authentication errors
        s.on("connect_error", async (error) => {
            console.error("[useSocket] Connection error:", error.message);
            if (error.message === "Unauthorized") {
                try {
                    console.log("[useSocket] Attempting token refresh...");
                    const newToken = await AuthService.refreshToken();
                    s.auth = { token: newToken };
                    s.connect();
                } catch (err) {
                    console.error("[useSocket] Failed to refresh token:", err);
                    window.location.href = '/login';
                }
            }
        });

        return () => {
            console.log("[useSocket] Cleaning up socket connection");
            s.disconnect();
        };
    }, []);

    return {
        socket,
        socketId,
        isConnected,
        messages,
        directMessages,
        setMessages,
        setDirectMessages,
        addMessage,
    };
}
