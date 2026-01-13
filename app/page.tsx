"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/contexts/auth-context";
import { useState } from "react";
import * as React from "react";
import { useSocket } from "@/hooks/useSocket";

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <ChatPageContent />
    </ProtectedRoute>
  );
}

function ChatPageContent() {
  const { socket, socketId, isConnected, messages, directMessages: hookDirectMessages, addMessage } = useSocket();
  const { user, logout } = useAuth();
  
  const [room, setRoom] = useState("");
  const [text, setText] = useState("");
  const [targetUsername, setTargetUsername] = useState("");
  const [dmText, setDmText] = useState("");
  const [directMessages, setDirectMessages] = useState<any[]>([]);
  
  // Generate consistent color for each username
  const getUserColor = (username: string) => {
    const colors = [
      'text-red-500',
      'text-blue-500',
      'text-green-500',
      'text-yellow-500',
      'text-purple-500',
      'text-pink-500',
      'text-indigo-500',
      'text-cyan-500',
      'text-orange-500',
      'text-teal-500',
    ];
    
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };
  
  // Combine and deduplicate messages by timestamp and content
  const allDirectMessages = React.useMemo(() => {
    const combined = [...directMessages, ...hookDirectMessages];
    const seen = new Set<string>();
    const unique = combined.filter(msg => {
      const key = `${msg.timestamp}-${msg.content}-${msg.from}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    // Sort by timestamp chronologically (oldest first)
    return unique.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [directMessages, hookDirectMessages]);

  const join = () => {
    const roomName = room.trim();
    if (!roomName) {
      return;
    }
    if (!socket) {
      return;
    }
    if (!isConnected) {
      return;
    }
    socket.emit("joinRoom", { room: roomName });
  };

  const leave = () => {
    const roomName = room.trim();
    if (!roomName || !socket || !isConnected) return;
    socket.emit("leaveRoom", { room: roomName });
  };

  const send = () => {
    if (!text.trim() || !room.trim() || !socket) return;
    const message = text.trim();
    
    socket.emit("roomMessage", { room: room.trim(), message });
    setText("");
  };

  const handleSendDirectMessage = () => {
    if (!targetUsername.trim() || !dmText.trim() || !socket) {
      return;
    }
    const message = dmText.trim();
    const target = targetUsername.trim();
    
    // Add optimistic update - show immediately in UI
    const optimisticMessage = {
      id: Date.now().toString(),
      content: message,
      from: 'You',
      to: target,
      timestamp: new Date().toISOString(),
      isSent: true,
      message: message
    };
    setDirectMessages((prev: any) => [...prev, optimisticMessage]);
    
    // Try both field names the backend might expect
    const payload = { 
      targetUsername: target, 
      to: target,
      recipient: target,
      message 
    };
    
    // Send to backend
    socket.emit("directMessage", payload);
    
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
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          <Button variant="outline" size="sm" onClick={handleLogout}>Logout</Button>
          <ModeToggle />
        </div>
      </header>

      {/* Room Section */}
      <section className="border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3">Room Chat</h2>
        <div className="space-y-2">
          <Input placeholder="Room Name" value={room} onChange={(e) => setRoom(e.target.value)} onKeyDown={(e) => e.key === "Enter" && join()} />
          <div className="flex gap-2">
            <Button onClick={join}>Join</Button>
            <Button onClick={leave} variant="outline">Leave</Button>
          </div>
          <Input placeholder="Message" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
          <Button onClick={send}>Send</Button>
          <ul className="mt-2 space-y-1">
            {messages.map((m, i) => {
              // Parse message to extract username if it's in format [username]: message
              const match = m.match(/^\[(.+?)\]: (.+)$/);
              if (match) {
                const [, username, content] = match;
                return (
                  <li key={i} className="text-sm">
                    <span className={`font-semibold ${getUserColor(username)}`}>{username}:</span> {content}
                  </li>
                );
              }
              return <li key={i} className="text-sm">{m}</li>;
            })}
          </ul>
        </div>
      </section>

      {/* Direct Messages Section */}
      <section className="border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3">Direct Messages</h2>
        <div className="space-y-2">
          <Input placeholder="Target Username" value={targetUsername} onChange={(e) => setTargetUsername(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSendDirectMessage()} />
          <Input placeholder="Message" value={dmText} onChange={(e) => setDmText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSendDirectMessage()} />
          <Button onClick={handleSendDirectMessage}>Send DM</Button>
          <ul className="mt-2 space-y-1">
            {allDirectMessages.map((m, i) => (
              <li key={i} className={`text-sm ${m.isSent ? 'text-blue-500' : ''}`}>
                <span className="font-semibold">{m.from}:</span> {m.content}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
