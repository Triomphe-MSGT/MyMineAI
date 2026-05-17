import { useCallback, useEffect, useRef, useState } from 'react';
import { socket } from '../socket.js';

export function useChat() {
  const [messages, setMessages] = useState([]);
  const roomIdRef = useRef(null);

  const setRoomId = useCallback((roomId) => {
    roomIdRef.current = roomId;
  }, []);

  const sendMessage = useCallback((message) => {
    const roomId = roomIdRef.current;
    if (!roomId) return;
    socket.emit('chat-message', { roomId, message });
  }, []);

  useEffect(() => {
    const onChatMessage = (message) => {
      setMessages((prev) => [...prev, message]);
    };

    socket.on('chat-message', onChatMessage);
    return () => {
      socket.off('chat-message', onChatMessage);
    };
  }, []);

  return {
    messages,
    setRoomId,
    sendMessage,
  };
}

