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

        s.on("message", (msg) => {
            console.log("[useSocket] Room message received:", msg);
            setMessages((prev) => [...prev, msg]);
        });

        s.on("directMessage", (msg) => {
            console.log("[useSocket] Direct message received:", msg);
            setDirectMessages((prev) => [...prev, msg]);
        });

        // Listen for room events
        s.on("joinedRoom", (room: string) => {
            console.log("[useSocket] Successfully joined room:", room);
            setMessages((prev) => [...prev, `[System] Joined room: ${room}`]);
        });

        s.on("leftRoom", (room: string) => {
            console.log("[useSocket] Left room:", room);
            setMessages((prev) => [...prev, `[System] Left room: ${room}`]);
        });

        s.on("error", (error: string) => {
            console.error("[useSocket] Socket error:", error);
            setMessages((prev) => [...prev, `[Error] ${error}`]);
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
    };
}
