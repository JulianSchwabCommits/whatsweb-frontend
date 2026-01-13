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
  const [targetUsername, setTargetUsername] = useState("");
  const [dmText, setDmText] = useState("");

  const join = () => {
<<<<<<< HEAD
    if (!room.trim() || !socket || !isConnected) return;
    socket.emit("joinRoom", { room: room.trim() });
  };

  const leave = () => {
    if (!room.trim() || !socket || !isConnected) return;
    socket.emit("leaveRoom", { room: room.trim() });
=======
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
>>>>>>> 3f8a2e9945a6b7f7a8d5aa2aaac9ee7da5c1403e
  };

  const send = () => {
    if (!text.trim() || !room.trim() || !socket) return;
    const message = text.trim();
<<<<<<< HEAD
    addMessage(`[${user?.username}]: ${message}`);
=======
    console.log("Sending message to room:", room.trim(), "message:", message);
    
>>>>>>> 3f8a2e9945a6b7f7a8d5aa2aaac9ee7da5c1403e
    socket.emit("roomMessage", { room: room.trim(), message });
    setText("");
  };

<<<<<<< HEAD
  const handleSendDM = () => {
    if (!targetId.trim() || !dmText.trim()) return;
    sendDirectMessage(targetId.trim(), dmText.trim());
=======
  const sendDirectMessage = () => {
    if (!targetUsername.trim() || !dmText.trim() || !socket) {
      console.error("Cannot send DM - missing targetUsername, message, or socket");
      return;
    }
    const message = dmText.trim();
    const target = targetUsername.trim();
    console.log("Sending direct message - payload:", { targetUsername: target, message });
    
    // Send to backend
    socket.emit("directMessage", { targetUsername: target, message });
    
>>>>>>> 3f8a2e9945a6b7f7a8d5aa2aaac9ee7da5c1403e
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
            {isConnected ? '● Connected' : '○ Disconnected'}
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

      <section>
        <h2>Direct Message</h2>
        <Input className="mb-2" placeholder="Target Username" value={targetUsername} onChange={(e) => setTargetUsername(e.target.value)} />
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
