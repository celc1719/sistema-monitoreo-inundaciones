// src/socket.js
import { io } from 'socket.io-client';
import { BACKEND } from './api';

let socket = null;
export function connectSocket() {
  if (socket) return socket;
  socket = io(BACKEND, { transports: ['websocket'] });
  return socket;
}
export function getSocket() {
  return socket;
}
