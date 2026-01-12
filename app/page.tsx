"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/contexts/auth-context";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { useSocket } from "@/hooks/useSocket";

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <ChatPageContent />
    </ProtectedRoute>
  );
}

function ChatPageContent() {
  const { socket, socketId, isConnected, messages, directMessages, setDirectMessages, addMessage } = useSocket();
  const { resolvedTheme } = useTheme();
  const { user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);

  const [room, setRoom] = useState("");
  const [text, setText] = useState("");
  const [targetId, setTargetId] = useState("");
  const [dmText, setDmText] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const join = () => {
    const roomName = room.trim();
    console.log("[ChatPage] Join button clicked, room:", roomName, "socket:", socket, "isConnected:", isConnected);
    if (!roomName) {
      console.warn("[ChatPage] Room name is empty");
      return;
    }
    if (!socket) {
      console.error("[ChatPage] Socket is null");
      return;
    }
    if (!isConnected) {
      console.error("[ChatPage] Socket is not connected");
      return;
    }
    socket.emit("joinRoom", { room: roomName });
    console.log("[ChatPage] Emitted joinRoom event for:", roomName);
  };

  const leave = () => {
    const roomName = room.trim();
    console.log("[ChatPage] Leave button clicked, room:", roomName);
    if (!roomName || !socket || !isConnected) return;
    socket.emit("leaveRoom", { room: roomName });
  };

  const send = () => {
    if (!text.trim() || !room.trim() || !socket) {
      console.error("Cannot send - missing text, room, or socket");
      return;
    }
    const message = text.trim();
    console.log("Sending message to room:", room.trim(), "message:", message);
    
    socket.emit("roomMessage", { room: room.trim(), message });
    setText("");
  };

  const sendDirectMessage = () => {
    if (!targetId.trim() || !dmText.trim() || !socket) {
      console.error("Cannot send DM - missing targetId, message, or socket");
      return;
    }
    const message = dmText.trim();
    const target = targetId.trim();
    console.log("Sending direct message - payload:", { targetId: target, message });
    
    // Send to backend
    socket.emit("directMessage", { targetId: target, message });
    
    // Add optimistic update
    const displayMessage = `[To ${target.slice(0, 8)}]: ${message}`;
    setDirectMessages((prev) => [...prev, displayMessage]);
    setDmText("");
  };

  

  const handleLogout = async () => {
    await logout();
  };

  return (
    <main className="p-6 space-y-4">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {mounted && <Image src={`/${resolvedTheme === "dark" ? "white" : "black"}-whatsweb.ico`} alt="WhatsWeb Logo" width={32} height={32} />}
          <h1 className="text-2xl font-bold">WhatsWeb</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm">
            Welcome, <span className="font-semibold">{user?.username}</span>
          </span>
          <span className={`text-sm ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
            {isConnected ? '● Connected' : '○ Disconnected'} {socketId && `(${socketId})`}
          </span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Logout
          </Button>
          <ModeToggle />
        </div>
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
