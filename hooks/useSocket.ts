"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { BACKEND_URL } from "@/lib/env";
import { AppSocket } from "@/types/socket";
import { AuthService } from "@/lib/auth-service";

export function useSocket() {
    const [socket, setSocket] = useState<AppSocket | null>(null);
    const [socketId, setSocketId] = useState("");
    const [messages, setMessages] = useState<string[]>([]);
    const [directMessages, setDirectMessages] = useState<string[]>([]); // new state

    useEffect(() => {
        const token = AuthService.getAccessToken();
        
        const s: AppSocket = io(BACKEND_URL, { 
            transports: ["websocket"],
            auth: {
                token: token,
            }
        });
        setSocket(s);

        s.on("connect", () => setSocketId(s.id ?? ""));
        s.on("message", (msg) => setMessages((prev) => [...prev, msg]));
        s.on("directMessage", (msg) =>
            setDirectMessages((prev) => [...prev, msg])
        );

        // Handle authentication errors
        s.on("connect_error", async (error) => {
            if (error.message === "Unauthorized") {
                try {
                    const newToken = await AuthService.refreshToken();
                    s.auth = { token: newToken };
                    s.connect();
                } catch (err) {
                    console.error("Failed to refresh token:", err);
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
        messages,
        directMessages,
        setMessages,
        setDirectMessages,
    };
}
