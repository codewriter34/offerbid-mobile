import {io, Socket} from 'socket.io-client';
import {API_CONFIG} from '../config/api';

let socket: Socket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

export type SocketEvent =
  | 'bid:new'
  | 'bid:updated'
  | 'listing:updated'
  | 'notification:new';

interface SocketCallbacks {
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: Error) => void;
  onReconnectAttempt?: (attempt: number) => void;
}

export function connectSocket(
  token: string,
  callbacks?: SocketCallbacks,
): Socket {
  if (socket?.connected) {
    return socket;
  }

  socket = io(API_CONFIG.SOCKET_URL, {
    auth: {token},
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
    timeout: 20000,
  });

  socket.on('connect', () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    callbacks?.onConnect?.();
  });

  socket.on('disconnect', reason => {
    callbacks?.onDisconnect?.(reason);
    if (reason === 'io server disconnect') {
      reconnectTimer = setTimeout(() => {
        socket?.connect();
      }, 5000);
    }
  });

  socket.on('connect_error', error => {
    callbacks?.onError?.(error);
  });

  socket.io.on('reconnect_attempt', attempt => {
    callbacks?.onReconnectAttempt?.(attempt);
  });

  return socket;
}

export function subscribeToEvent<T = unknown>(
  event: SocketEvent | string,
  handler: (data: T) => void,
): () => void {
  if (!socket) return () => {};
  socket.on(event, handler);
  return () => {
    socket?.off(event, handler);
  };
}

export function emitEvent(event: string, data?: unknown): void {
  socket?.emit(event, data);
}

export function joinRoom(room: string): void {
  socket?.emit('join', room);
}

export function leaveRoom(room: string): void {
  socket?.emit('leave', room);
}

export function disconnectSocket(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  socket?.removeAllListeners();
  socket?.disconnect();
  socket = null;
}

export function getSocket(): Socket | null {
  return socket;
}

export function isConnected(): boolean {
  return socket?.connected ?? false;
}
