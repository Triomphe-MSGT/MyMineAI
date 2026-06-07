import { useCallback } from 'react';
import { useSocket } from './useSocket';
import { useRoomStore } from '@/stores/roomStore';

export function useChat() {
  const { emit } = useSocket();
  const { addMessage } = useRoomStore();

  const sendMessage = useCallback(
    (content: string) => {
      if (!content.trim()) return;
      emit('chat:message', { content: content.trim() });
    },
    [emit]
  );

  return { sendMessage, addMessage };
}
