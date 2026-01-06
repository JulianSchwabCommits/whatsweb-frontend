"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/contexts/auth-context";
import { useState } from "react";
import { useSocket } from "@/hooks/useSocket";

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <ChatPageContent />
    </ProtectedRoute>
  );
}

function ChatPageContent() {
  const { socket, socketId, isConnected, messages, directMessages, sendDirectMessage, addMessage } = useSocket();
  const { user, logout } = useAuth();
  
  const [room, setRoom] = useState("");
  const [text, setText] = useState("");
  const [targetId, setTargetId] = useState("");
  const [dmText, setDmText] = useState("");

  const join = () => {
    if (!room.trim() || !socket || !isConnected) return;
    socket.emit("joinRoom", { room: room.trim() });
  };

  const leave = () => {
    if (!room.trim() || !socket || !isConnected) return;
    socket.emit("leaveRoom", { room: room.trim() });
  };

  const send = () => {
    if (!text.trim() || !room.trim() || !socket) return;
    const message = text.trim();
    addMessage(`[${user?.username}]: ${message}`);
    socket.emit("roomMessage", { room: room.trim(), message });
    setText("");
  };

  const handleSendDM = () => {
    if (!targetId.trim() || !dmText.trim()) return;
    sendDirectMessage(targetId.trim(), dmText.trim());
    setDmText("");
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <main className="p-6 space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">WhatsWeb</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm">Welcome, {user?.username}</span>
          <span className={`text-sm ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
            {isConnected ? '● Connected' : '○ Disconnected'} ({socketId})
          </span>
          <Button variant="outline" size="sm" onClick={handleLogout}>Logout</Button>
          <ModeToggle />
        </div>
      </header>

      {/* Room Section */}
      <section className="border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3">Room Chat</h2>
        <div className="space-y-2">
          <Input placeholder="Room" value={room} onChange={(e) => setRoom(e.target.value)} />
          <div className="flex gap-2">
            <Button onClick={join}>Join</Button>
            <Button onClick={leave} variant="outline">Leave</Button>
          </div>
          <Input placeholder="Message" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
          <Button onClick={send}>Send</Button>
          <ul className="mt-2 space-y-1">
            {messages.map((m, i) => (
              <li key={i} className="text-sm">{m}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Direct Message Section - Clean from scratch */}
      <section className="border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3">Direct Messages</h2>
        
        <div className="mb-4 p-3 bg-muted rounded">
          <p className="text-xs font-semibold mb-1">Your Socket ID:</p>
          <code className="text-xs">{socketId}</code>
        </div>

        <div className="space-y-3 mb-4">
          <Input 
            placeholder="Recipient Socket ID" 
            value={targetId} 
            onChange={(e) => setTargetId(e.target.value)} 
          />
          <div className="flex gap-2">
            <Input 
              placeholder="Type your message..." 
              value={dmText} 
              onChange={(e) => setDmText(e.target.value)} 
              onKeyDown={(e) => e.key === "Enter" && handleSendDM()}
            />
            <Button onClick={handleSendDM} disabled={!isConnected || !targetId.trim() || !dmText.trim()}>
              Send
            </Button>
          </div>
        </div>

        <ul className="mt-2 space-y-1">
          {directMessages.map((dm) => (
            <li key={dm.id} className="text-sm">
              {dm.isSent ? `[You → ${dm.to.slice(0,8)}]: ` : `[From ${dm.from.slice(0,8)}]: `}
              {dm.content}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
