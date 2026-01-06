import { Socket } from "socket.io-client";

export type ServerToClientEvents = {
    message: (msg: string) => void;
    directMessage: (msg: string) => void;
    joinedRoom: (room: string) => void;
    leftRoom: (room: string) => void;
    error: (error: string) => void;
};

export type ClientToServerEvents = {
    joinRoom: (room: string) => void;
    leaveRoom: (room: string) => void;
    message: (msg: string) => void;
    roomMessage: (data: { room: string; message: string }) => void;
    directMessage: (data: { targetId: string; message: string }) => void;
};

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;
