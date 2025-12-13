"use client";

import { useState } from "react";
import { useSocket } from "../hooks/useSocket";

export default function ChatPage() {
  const { socket, socketId, messages, directMessages, setDirectMessages } = useSocket();

  const [room, setRoom] = useState("");
  const [text, setText] = useState("");
  const [targetId, setTargetId] = useState("");
  const [dmText, setDmText] = useState("");

  const join = () => socket?.emit("joinRoom", room.trim());
  const leave = () => socket?.emit("leaveRoom", room.trim());

  const send = () => {
    if (!text.trim()) return;
    socket?.emit("message", text.trim());
    setText("");
  };

  const sendDirectMessage = () => {
    if (!targetId.trim() || !dmText.trim() || !socket) return;

    socket.emit("directMessage", { targetId: targetId.trim(), message: dmText.trim() });
    setDirectMessages((prev) => [...prev, `[To ${targetId.slice(0, 2)}]: ${dmText.trim()}`]);
    setDmText("");
  };

  return (
    <main className="p-6 space-y-4">
      <div>Socket ID: {socketId}</div>

      <section>
        <h3>Room</h3>
        <input placeholder="Room" value={room} onChange={(e) => setRoom(e.target.value)} />
        <button onClick={join}>Join</button>
        <button onClick={leave}>Leave</button>

        <input placeholder="Message" value={text} onChange={(e) => setText(e.target.value)} />
        <button onClick={send}>Send</button>

        <ul>
          {messages.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      </section>

      <section>
        <h3>Direct Message</h3>
        <input placeholder="Target Socket ID" value={targetId} onChange={(e) => setTargetId(e.target.value)} />
        <input placeholder="Message" value={dmText} onChange={(e) => setDmText(e.target.value)} />
        <button onClick={sendDirectMessage}>Send DM</button>

        <ul>
          {directMessages.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
