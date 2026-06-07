import { useCallback, useEffect, useRef } from 'react';
import { connectSocket, getSocket } from '@/services/signaling';
import type { ClientEvents, ServerEvents } from '@mymeet/shared-types';

type EventHandler<K extends keyof ServerEvents> = (
  data: ServerEvents[K]
) => void;

export function useSocket() {
  const socketRef = useRef(getSocket());

  useEffect(() => {
    const socket = connectSocket();
    socketRef.current = socket;
  }, []);

  const on = useCallback(<K extends keyof ServerEvents>(
    event: K,
    handler: EventHandler<K>
  ) => {
    const socket = socketRef.current;
    socket.on(event, handler as (...args: unknown[]) => void);
    return () => {
      socket.off(event, handler as (...args: unknown[]) => void);
    };
  }, []);

  const emit = useCallback(<K extends keyof ClientEvents>(
    event: K,
    data: ClientEvents[K]
  ) => {
    socketRef.current.emit(event, data);
  }, []);

  return { socket: socketRef.current, on, emit };
}
