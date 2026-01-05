import { io } from 'socket.io-client';

export let socket;

export const connectSocket = (playerName) => {
  socket = io('http://localhost:8000', {
    transports: ['websocket'],
    query: { playerName }
  });

  socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
  });

  return socket;
};