import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { socket } from '../socket.js';

export function useRoom() {
  const roomIdRef = useRef(null);
  const [participantsBySocketId, setParticipantsBySocketId] = useState(() => new Map());

  const participants = useMemo(
    () => [...participantsBySocketId.entries()].map(([socketId, p]) => ({ socketId, ...p })),
    [participantsBySocketId],
  );

  const joinRoom = useCallback(({ roomId, participant }) => {
    roomIdRef.current = roomId;
    socket.emit('join-room', { roomId, participant });
  }, []);

  const leaveRoom = useCallback(() => {
    roomIdRef.current = null;
    setParticipantsBySocketId(new Map());
    if (socket.connected) socket.disconnect();
  }, []);

  const updateMyState = useCallback((partialState) => {
    socket.emit('update-state', partialState);
  }, []);

  useEffect(() => {
    const onRoomParticipants = (existing) => {
      const next = new Map();
      for (const p of existing) {
        const { socketId, ...rest } = p;
        next.set(socketId, rest);
      }
      setParticipantsBySocketId(next);
    };

    const onParticipantJoined = (p) => {
      setParticipantsBySocketId((prev) => {
        const next = new Map(prev);
        const { socketId, ...rest } = p;
        next.set(socketId, rest);
        return next;
      });
    };

    const onParticipantUpdated = (p) => {
      setParticipantsBySocketId((prev) => {
        const next = new Map(prev);
        const { socketId, ...rest } = p;
        next.set(socketId, rest);
        return next;
      });
    };

    const onParticipantLeft = ({ socketId }) => {
      setParticipantsBySocketId((prev) => {
        const next = new Map(prev);
        next.delete(socketId);
        return next;
      });
    };

    socket.on('room-participants', onRoomParticipants);
    socket.on('participant-joined', onParticipantJoined);
    socket.on('participant-updated', onParticipantUpdated);
    socket.on('participant-left', onParticipantLeft);

    return () => {
      socket.off('room-participants', onRoomParticipants);
      socket.off('participant-joined', onParticipantJoined);
      socket.off('participant-updated', onParticipantUpdated);
      socket.off('participant-left', onParticipantLeft);
    };
  }, []);

  return {
    roomId: roomIdRef.current,
    participants,
    participantsBySocketId,
    joinRoom,
    leaveRoom,
    updateMyState,
  };
}

