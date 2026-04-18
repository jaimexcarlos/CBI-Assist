import { io } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';

let socket = null;

export const connectSocket = () => {
  const { token } = useAuthStore.getState();
  
  if (!token) {
    console.warn('No token available for socket connection');
    return null;
  }
  
  if (socket?.connected) {
    return socket;
  }
  
  socket = io('http://localhost:3001', {
    auth: { token }
  });
  
  socket.on('connect', () => {
    console.log('✅ Socket connected');
  });
  
  socket.on('disconnect', () => {
    console.log('❌ Socket disconnected');
  });
  
  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });
  
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;
