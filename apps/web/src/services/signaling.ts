import { io, Socket } from 'socket.io-client';
import type { ClientEvents, ServerEvents } from '@mymeet/shared-types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

type TypedSocket = Socket<ServerEvents, ClientEvents>;

let socket: TypedSocket | null = null;

export function getSocket(): TypedSocket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function connectSocket(): TypedSocket {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  if (socket?.connected) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
