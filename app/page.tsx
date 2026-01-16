"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/contexts/auth-context";
import { useSocket } from "@/hooks/useSocket";

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <ChatPageContent />
    </ProtectedRoute>
  );
}

function ChatPageContent() {
  const { socket, isConnected, messages, directMessages: hookDirectMessages } = useSocket();
  const { user, logout } = useAuth();

  const [room, setRoom] = useState("");
  const [text, setText] = useState("");
  const [targetUsername, setTargetUsername] = useState("");
  const [dmText, setDmText] = useState("");
  const [directMessages, setDirectMessages] = useState<any[]>([]);

  // Generate consistent color for each username
  const getUserColor = (username: string) => {
    const colors = [
      "text-red-500", "text-blue-500", "text-green-500", "text-yellow-500",
      "text-purple-500", "text-pink-500", "text-indigo-500", "text-cyan-500",
      "text-orange-500", "text-teal-500",
    ];
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Combine and deduplicate direct messages
  const allDirectMessages = useMemo(() => {
    const combined = [...directMessages, ...hookDirectMessages];
    const seen = new Set<string>();
    return combined
      .filter(msg => {
        const key = `${msg.timestamp}-${msg.content}-${msg.from}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [directMessages, hookDirectMessages]);

  // Generic function for sending room messages
  const sendRoomMessage = () => {
    const message = text.trim();
    const roomName = room.trim();
    if (!socket || !message || !roomName) return;

    socket.emit("roomMessage", { room: roomName, message });
    setText("");
  };

  const joinRoom = () => {
    const roomName = room.trim();
    if (!socket || !roomName || !isConnected) return;
    socket.emit("joinRoom", { room: roomName });
  };

  const leaveRoom = () => {
    const roomName = room.trim();
    if (!socket || !roomName || !isConnected) return;
    socket.emit("leaveRoom", { room: roomName });
  };

  const sendDirectMessage = () => {
    const target = targetUsername.trim();
    const message = dmText.trim();
    if (!socket || !target || !message) return;

    const optimisticMessage = {
      id: Date.now().toString(),
      content: message,
      from: "You",
      to: target,
      timestamp: new Date().toISOString(),
      isSent: true,
    };
    setDirectMessages(prev => [...prev, optimisticMessage]);

    const payload = { targetUsername: target, to: target, recipient: target, message };
    socket.emit("directMessage", payload);

    setDmText("");
  };

  const handleLogout = async () => await logout();

  // Utility for handling Enter key for any input
  const handleEnter = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter") action();
  };

  return (
    <main className="p-6 space-y-6">
      {/* Header */}
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">WhatsWeb</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm">Welcome, {user?.username}</span>
          <span className={`text-sm ${isConnected ? "text-green-500" : "text-red-500"}`}>
            {isConnected ? "Connected" : "Disconnected"}
          </span>
          <Button variant="outline" size="sm" onClick={handleLogout}>Logout</Button>
          <ModeToggle />
        </div>
      </header>

      {/* Room Chat */}
      <section className="border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3">Room Chat</h2>
        <div className="space-y-2">
          <Input
            placeholder="Room Name"
            value={room}
            onChange={e => setRoom(e.target.value)}
            onKeyDown={e => handleEnter(e, joinRoom)}
          />
          <div className="flex gap-2">
            <Button onClick={joinRoom}>Join</Button>
            <Button onClick={leaveRoom} variant="outline">Leave</Button>
          </div>
          <Input
            placeholder="Message"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => handleEnter(e, sendRoomMessage)}
          />
          <Button onClick={sendRoomMessage}>Send</Button>

          <ul className="mt-2 space-y-1">
            {messages.map((m, i) => {
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

      {/* Direct Messages */}
      <section className="border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3">Direct Messages</h2>
        <div className="space-y-2">
          <Input
            placeholder="Target Username"
            value={targetUsername}
            onChange={e => setTargetUsername(e.target.value)}
            onKeyDown={e => handleEnter(e, sendDirectMessage)}
          />
          <Input
            placeholder="Message"
            value={dmText}
            onChange={e => setDmText(e.target.value)}
            onKeyDown={e => handleEnter(e, sendDirectMessage)}
          />
          <Button onClick={sendDirectMessage}>Send DM</Button>

          <ul className="mt-2 space-y-1">
            {allDirectMessages.map((m, i) => (
              <li key={i} className={`text-sm ${m.isSent ? "text-blue-500" : ""}`}>
                <span className="font-semibold">{m.from}:</span> {m.content}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
