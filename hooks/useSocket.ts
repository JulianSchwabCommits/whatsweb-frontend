"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { BACKEND_URL } from "@/lib/env";
import { AppSocket, ChatMessage } from "@/types/socket";

export function useSocket() {
    const [socket, setSocket] = useState<AppSocket | null>(null);
    const [socketId, setSocketId] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [directMessages, setDirectMessages] = useState<ChatMessage[]>([]);

    useEffect(() => {
        const s: AppSocket = io(BACKEND_URL, { transports: ["websocket"] });
        setSocket(s);

        s.on("connect", () => setSocketId(s.id ?? ""));
        s.on("message", (msg) => {
            // Route direct messages 
            if (msg.type === "direct") {
                setDirectMessages((prev) => [...prev, msg]);
            } else {
                setMessages((prev) => [...prev, msg]);
            }
        });
        s.on("directMessage", (msg) =>
            setDirectMessages((prev) => [...prev, msg])
        );

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

