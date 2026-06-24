import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : "http://localhost:5000";

const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
});

// When connected, if the logged-in user is a caregiver, join their personal room
socket.on('connect', () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.role === 'caregiver' && user._id) {
        socket.emit('join-caregiver-room', user._id);
        console.log(`[Socket] Joined caregiver room: caregiver-${user._id}`);
      }
    } catch (e) {
      console.error('[Socket] Could not parse user from localStorage', e);
    }
  }
});

export default socket;
