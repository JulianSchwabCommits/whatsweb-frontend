"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { useSocket } from "@/hooks/useSocket";
import { ChatMessage } from "@/types/socket";

function MessageItem({ message }: { message: ChatMessage }) {
  const isSent = message.type === "direct" && "recipient" in message && message.recipient;
  const colors: Record<string, string> = {
    room: "text-blue-500",
    direct: isSent ? "text-green-500" : "text-purple-500",
    system: "text-muted-foreground",
    error: "text-red-500",
  };

  return (
    <div className="flex items-center gap-1.5 text-sm py-0.5">
      <span className={`${colors[message.type]} font-medium`}>
        {message.type === "room" ? `#${message.room}` : message.type === "direct" ? (isSent ? `→${message.recipient?.slice(0, 4)}` : message.sender.slice(0, 4)) : message.type.toUpperCase()}
      </span>
      <span className="text-muted-foreground">·</span>
      <span>{message.content}</span>
    </div>
  );
}

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
    setDirectMessages((prev) => [
      ...prev,
      { type: "direct", sender: socketId, recipient: targetId.trim(), content: dmText.trim() },
    ]);
    setDmText("");
  };

  return (
    <main className="p-6 space-y-4">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {mounted && <Image src={`/${resolvedTheme === "dark" ? "white" : "black"}-whatsweb.ico`} alt="WhatsWeb Logo" width={32} height={32} />}
          <h1 className="text-2xl font-bold">WhatsWeb</h1>
        </div>
        <span className="text-sm text-muted-foreground">Your ID: <code className="bg-muted px-1 rounded">{socketId}</code></span>
        <ModeToggle />
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Room Chat</h2>
        <div className="flex gap-2">
          <Input className="flex-1" placeholder="Room name" value={room} onChange={(e) => setRoom(e.target.value)} onKeyDown={(e) => e.key === "Enter" && join()} />
          <Button onClick={join}>Join</Button>
          <Button variant="outline" onClick={leave}>Leave</Button>
        </div>
        <div className="flex gap-2">
          <Input className="flex-1" placeholder="Type a message..." value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
          <Button onClick={send}>Send</Button>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto rounded-lg border p-3">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No messages yet. Join a room to start chatting!</p>
          ) : (
            messages.map((m, i) => <MessageItem key={i} message={m} />)
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Direct Messages</h2>
        <div className="flex gap-2">
          <Input className="w-48" placeholder="Target ID" value={targetId} onChange={(e) => setTargetId(e.target.value)} />
          <Input className="flex-1" placeholder="Type a message..." value={dmText} onChange={(e) => setDmText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendDirectMessage()} />
          <Button onClick={sendDirectMessage}>Send DM</Button>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto rounded-lg border p-3">
          {directMessages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No direct messages yet.</p>
          ) : (
            directMessages.map((m, i) => <MessageItem key={i} message={m} />)
          )}
        </div>
      </section>
    </main>
  );
}

