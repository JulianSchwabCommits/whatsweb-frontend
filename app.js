// app.js
const socket = io('http://localhost:8080');

const $ = selector => document.querySelector(selector);
const getVal = selector => $(selector).value.trim();

const renderMessage = msg => {
  const li = document.createElement('li');
  li.innerText = msg;
  $('#messages').appendChild(li);
};

socket.on('connect', () => $('#socket-id-display').innerText = `Your Socket ID: ${socket.id}`);
socket.on('message', renderMessage);

const actions = {
  joinRoom: () => {
    const room = getVal('#room-input');
    if(room) socket.emit('joinRoom', room);
  },
  leaveRoom: () => {
    const room = getVal('#room-input');
    if(room) socket.emit('leaveRoom', room);
  },
  roomMessage: () => {
    const room = getVal('#room-name-input');
    const message = getVal('#room-message-input');
    if(room && message) {
      socket.emit('roomMessage', { room, message });
      $('#room-message-input').value = '';
    }
  },
  privateMessage: () => {
    const targetId = getVal('#target-id-input');
    const message = getVal('#message-input');
    if(targetId && message) {
      socket.emit('privateMessage', { targetId, message });
      $('#message-input').value = '';
    }
  }
};

document.querySelectorAll('button[data-action]').forEach(btn => {
  const action = btn.dataset.action;
  btn.onclick = () => actions[action]();
});
