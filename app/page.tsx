"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { useSocket } from "@/hooks/useSocket";

export default function ChatPage() {
  const { socket, socketId, messages, directMessages, setDirectMessages } = useSocket();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [room, setRoom] = useState("");
  const [text, setText] = useState("");
  const [targetId, setTargetId] = useState("");
  const [dmText, setDmText] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

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
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {mounted && <Image src={`/${resolvedTheme === "dark" ? "white" : "black"}-whatsweb.ico`} alt="WhatsWeb Logo" width={32} height={32} />}
          <h1 className="text-2xl font-bold">WhatsWeb</h1>
        </div>
        <span>Your ID: {socketId}</span>
        <ModeToggle />
      </header>

      <section>
        <h2>Room</h2>
        <Input className="mb-2" placeholder="Room" value={room} onChange={(e) => setRoom(e.target.value)} onKeyDown={(e) => e.key === "Enter" && join()} />
        <Button className="mr-2" onClick={join}>Join</Button>
        <Button onClick={leave}>Leave</Button>
        <Input className="mt-2 mb-2" placeholder="Message" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
        <Button onClick={send}>Send</Button>
        <ul className="mt-2">
          {messages.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Direct Message</h2>
        <Input className="mb-2" placeholder="Target ID" value={targetId} onChange={(e) => setTargetId(e.target.value)} />
        <Input className="mb-2" placeholder="Message" value={dmText} onChange={(e) => setDmText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendDirectMessage()} />
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
