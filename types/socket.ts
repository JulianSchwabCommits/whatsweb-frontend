import { Socket } from "socket.io-client";

export type ServerToClientEvents = {
    message: (msg: string | { type: string; content: string; timestamp: string }) => void;
    roomMessage: (msg: string | { type: string; content: string; timestamp: string }) => void;
    directMessage: (msg: string | { type: string; content: string; timestamp: string; sender?: string; targetUsername?: string }) => void;
    joinedRoom: (room: string) => void;
    leftRoom: (room: string) => void;
    error: (error: string | { message: string; code?: string }) => void;
};

export type ClientToServerEvents = {
    joinRoom: (data: { room: string } | string) => void;
    leaveRoom: (data: { room: string } | string) => void;
    message: (msg: string) => void;
    roomMessage: (data: { room: string; message: string }) => void;
    directMessage: (data: { targetUsername: string; message: string }) => void;
};

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;
