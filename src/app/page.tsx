"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export default function ChatPage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [socketId, setSocketId] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const [room, setRoom] = useState("");
  const [text, setText] = useState("");

  useEffect(() => {
    const s = io(process.env.NEXT_PUBLIC_BACKEND_URL!, {
      transports: ["websocket"],
    });

    setSocket(s);

    s.on("connect", () => setSocketId(s.id ?? ""));
    s.on("message", (msg: string) =>
      setMessages((m) => [...m, msg])
    );

    return () => {
      s.disconnect();
    };
  }, []);

  const join = () => socket?.emit("joinRoom", room.trim());
  const leave = () => socket?.emit("leaveRoom", room.trim());
  const send = () => {
    if (!text.trim()) return;
    socket?.emit("message", text.trim());
    setText("");
  };

  return (
    <main className="p-6 space-y-4">
      <div>Socket ID: {socketId}</div>

      <input
        placeholder="Room"
        value={room}
        onChange={(e) => setRoom(e.target.value)}
      />
      <button onClick={join}>Join</button>
      <button onClick={leave}>Leave</button>

      <input
        placeholder="Message"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button onClick={send}>Send</button>

      <ul>
        {messages.map((m, i) => (
          <li key={i}>{m}</li>
        ))}
      </ul>
    </main>
  );
}
