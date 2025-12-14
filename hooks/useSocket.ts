"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { BACKEND_URL } from "@/lib/env";
import { AppSocket } from "@/types/socket.type";

export function useSocket() {
    const [socket, setSocket] = useState<AppSocket | null>(null);
    const [socketId, setSocketId] = useState("");
    const [messages, setMessages] = useState<string[]>([]);
    const [directMessages, setDirectMessages] = useState<string[]>([]); // new state

    useEffect(() => {
        const s: AppSocket = io(BACKEND_URL, { transports: ["websocket"] });
        setSocket(s);

        s.on("connect", () => setSocketId(s.id ?? ""));
        s.on("message", (msg) => setMessages((prev) => [...prev, msg]));
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
