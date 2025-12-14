"use client";

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button";

import { useState } from "react";
import { useSocket } from "@/hooks/useSocket";

export default function ChatPage() {
  const { socket, socketId, messages, directMessages, setDirectMessages } = useSocket();

  const [room, setRoom] = useState("");
  const [text, setText] = useState("");
  const [targetId, setTargetId] = useState("");
  const [dmText, setDmText] = useState("");

  const join = () => socket?.emit("joinRoom", room.trim());
  const leave = () => socket?.emit("leaveRoom", room.trim());

  const send = () => {
    if (!text.trim() || !room.trim() || !socket) return;
    socket.emit("roomMessage", { room: room.trim(), message: text.trim() });
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
        <Input placeholder="Room" value={room} onChange={(e) => setRoom(e.target.value)} />
        <Button onClick={join}>Join</Button>
        <Button onClick={leave}>Leave</Button>
        <br />
        <Input placeholder="Message" value={text} onChange={(e) => setText(e.target.value)} />
        <Button onClick={send}>Send</Button>

        <ul>
          {messages.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      </section>

      <section>
        <h3>Direct Message</h3>
        <Input placeholder="Target Socket ID" value={targetId} onChange={(e) => setTargetId(e.target.value)} />
        <Input placeholder="Message" value={dmText} onChange={(e) => setDmText(e.target.value)} />
        <Button onClick={sendDirectMessage}>Send DM</Button>

        <ul>
          {directMessages.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}


