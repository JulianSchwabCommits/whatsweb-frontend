"use client";

import { ReactNode, useEffect, useState } from "react";
import { AppSocket } from "@/types/socket";
import { AuthService } from "@/lib/auth-service";
import { chatService } from "@/lib/chat-service";
import { toast } from "sonner";

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
        // Poll for socket connection (it may not be ready immediately after login)
        const checkSocket = () => {
            const s = chatService.getSocket() as AppSocket;
            if (s && s !== socket) {
                setSocket(s);
                setIsConnected(s.connected);
                setSocketId(s.id ?? "");

                s.on("connect", () => {
                    setSocketId(s.id ?? "");
                    setIsConnected(true);
                });
            }
        };

        // Check immediately
        checkSocket();

        // Poll every 500ms for socket availability
        const interval = setInterval(checkSocket, 500);

        return () => clearInterval(interval);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!socket) return;

        socket.on("connect", () => {
            setSocketId(socket.id ?? "");
            setIsConnected(true);
        });

        socket.on("disconnect", () => setIsConnected(false));

        // Room messaging
        socket.on("message", (msg: any) => {
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
        socket.on("directMessage", (msg: any) => {
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
        socket.on("joinedRoom", (room: string) => {
            addMessage(`[System] Joined room: ${room}`);
        });

        socket.on("leftRoom", (room: string) => {
            addMessage(`[System] Left room: ${room}`);
        });

        socket.on("error", (error: any) => {
            const errorMsg = typeof error === 'string' ? error : error.message || 'Unknown error';
            const errorCode = typeof error === 'object' ? error.code : null;
            
            // Silently ignore USER_NOT_FOUND and USER_OFFLINE for direct messages
            // The optimistic UI update already shows the message
            if (errorCode === 'USER_NOT_FOUND' || errorCode === 'USER_OFFLINE') {
                // Backend bug - ignore silently
                return;
            }
            
            // Show error toast to user with appropriate styling based on error code
            if (errorCode === 'AUTHENTICATION_FAILED') {
                toast.error('Authentication failed', {
                    description: errorMsg,
                    action: {
                        label: 'Login',
                        onClick: () => window.location.href = '/login'
                    }
                });
            } else if (errorCode === 'INVALID_ROOM') {
                toast.error('Invalid room', {
                    description: errorMsg
                });
            } else if (errorCode === 'RATE_LIMIT') {
                toast.warning('Rate limit exceeded', {
                    description: errorMsg
                });
            } else {
                // Generic error
                toast.error('Error', {
                    description: errorMsg
                });
            }
            
            // Also add to message log
            addMessage(`[Error] ${errorMsg}`);
        });
        
        // Handle authentication errors
        socket.on("connect_error", async (error) => {
            if (error.message === "Unauthorized") {
                try {
                    const newToken = await AuthService.refreshToken();
                    socket.auth = { token: newToken };
                    socket.connect();
                } catch {
                    toast.error('Session expired', {
                        description: 'Please login again to continue',
                        action: {
                            label: 'Login',
                            onClick: () => window.location.href = '/login'
                        }
                    });
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 2000);
                }
            } else {
                // Show connection error to user
                toast.error('Connection failed', {
                    description: error.message || 'Unable to connect to server'
                });
            }
        });

        return () => {
            // Don't disconnect here - let auth context manage lifecycle
        };
    }, [socket]);

    return {
        socket,
        socketId,
        isConnected,
        messages,
        directMessages,
        addMessage,
    };
}
