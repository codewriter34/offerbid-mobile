import {io, Socket} from 'socket.io-client';
import {API_CONFIG} from '../config/api';

let socket: Socket | null = null;

export function connectSocket(token: string): Socket {
  // TODO: Initialize Socket.io connection with auth token
  // Socket URL: wss://offerbid-api.onrender.com/realtime
  // Events to listen: 'bid:new', 'bid:updated', 'listing:updated'
  socket = io(API_CONFIG.SOCKET_URL, {
    auth: {token},
    transports: ['websocket'],
  });
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

export function getSocket(): Socket | null {
  return socket;
}
