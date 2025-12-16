import { Socket } from "socket.io-client";

export type RoomMessage = {
    type: "room";
    sender: string;
    room: string;
    content: string;
};

export type DirectMessage = {
    type: "direct";
    sender: string;
    recipient?: string;
    content: string;
};

export type SystemMessage = {
    type: "system";
    room?: string;
    content: string;
};

export type ErrorMessage = {
    type: "error";
    content: string;
};

export type ChatMessage = RoomMessage | DirectMessage | SystemMessage | ErrorMessage;

export type ServerToClientEvents = {
    message: (msg: ChatMessage) => void;
    directMessage: (msg: ChatMessage) => void;
};

export type ClientToServerEvents = {
    joinRoom: (room: string) => void;
    leaveRoom: (room: string) => void;
    message: (msg: string) => void;
    roomMessage: (data: { room: string; message: string }) => void;
    directMessage: (data: { targetId: string; message: string }) => void;
};

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;
