import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';

const socket = io('https://whatsweb-backend.azurewebsites.net');


function App() {
  const [socketId, setSocketId] = useState('');
  const [messages, setMessages] = useState([]);
  const [roomInput, setRoomInput] = useState('');
  const [roomNameInput, setRoomNameInput] = useState('');
  const [roomMessageInput, setRoomMessageInput] = useState('');
  const [targetIdInput, setTargetIdInput] = useState('');
  const [messageInput, setMessageInput] = useState('');

  useEffect(() => {
    socket.on('connect', () => {
      setSocketId(socket.id);
    });

    socket.on('message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      socket.off('connect');
      socket.off('message');
    };
  }, []);

  const joinRoom = () => {
    if (roomInput.trim()) {
      socket.emit('joinRoom', roomInput.trim());
    }
  };

  const leaveRoom = () => {
    if (roomInput.trim()) {
      socket.emit('leaveRoom', roomInput.trim());
    }
  };

  const sendRoomMessage = () => {
    if (roomNameInput.trim() && roomMessageInput.trim()) {
      socket.emit('roomMessage', { 
        room: roomNameInput.trim(), 
        message: roomMessageInput.trim() 
      });
      setRoomMessageInput('');
    }
  };

  const sendPrivateMessage = () => {
    if (targetIdInput.trim() && messageInput.trim()) {
      socket.emit('privateMessage', { 
        targetId: targetIdInput.trim(), 
        message: messageInput.trim() 
      });
      setMessageInput('');
    }
  };

  return (
    <div className="App">
      <h2>Chat</h2>
      <p>Your Socket ID: {socketId}</p>

      <div className="section">
        <h3>Manage Rooms</h3>
        <input 
          value={roomInput}
          onChange={(e) => setRoomInput(e.target.value)}
          placeholder="Room name"
        />
        <button onClick={joinRoom}>Join Room</button>
        <button onClick={leaveRoom}>Leave Room</button>
      </div>

      <div className="section">
        <h3>Send Message to a Room</h3>
        <input 
          value={roomNameInput}
          onChange={(e) => setRoomNameInput(e.target.value)}
          placeholder="Room name"
        />
        <input 
          value={roomMessageInput}
          onChange={(e) => setRoomMessageInput(e.target.value)}
          placeholder="Message"
        />
        <button onClick={sendRoomMessage}>Send</button>
      </div>

      <div className="section">
        <h3>Send Private Message</h3>
        <input 
          value={targetIdInput}
          onChange={(e) => setTargetIdInput(e.target.value)}
          placeholder="Target Socket ID"
        />
        <input 
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="Message"
        />
        <button onClick={sendPrivateMessage}>Send</button>
      </div>

      <div className="section">
        <h3>Messages</h3>
        <ul>
          {messages.map((msg, index) => (
            <li key={index}>{msg}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;