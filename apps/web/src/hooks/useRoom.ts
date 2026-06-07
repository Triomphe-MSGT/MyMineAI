import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { roomApi } from '@/services/api';
import { useSocket } from './useSocket';
import { useRoomStore } from '@/stores/roomStore';
import { useUserStore } from '@/stores/userStore';
import type { ChatMessage } from '@mymeet/shared-types';

export function useRoom(slug: string) {
  const navigate = useNavigate();
  const { on, emit } = useSocket();
  const { token, user } = useUserStore();
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localSocketId, setLocalSocketId] = useState('');
  const joiningRef = useRef(false);

  const leaveRoom = useCallback(() => {
    emit('room:leave', { roomSlug: slug });
    useRoomStore.getState().reset();
    navigate('/');
  }, [emit, slug, navigate]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const cleanups: (() => void)[] = [];

    cleanups.push(
      on('room:joined', ({ participant, room }) => {
        setLocalSocketId(participant.socketId);
        useRoomStore.getState().setRoom(room, participant);
        setJoined(true);
        setError(null);
        joiningRef.current = false;
      })
    );

    cleanups.push(
      on('room:user-joined', ({ participant }) => {
        useRoomStore.getState().addParticipant(participant);
      })
    );

    cleanups.push(
      on('room:user-left', ({ participantId }) => {
        useRoomStore.getState().removeParticipant(participantId);
      })
    );

    cleanups.push(
      on('user:state-changed', ({ participantId, isMuted, isVideoOn }) => {
        useRoomStore.getState().updateParticipantState(participantId, { isMuted, isVideoOn });
      })
    );

    cleanups.push(
      on('user:hand-changed', ({ participantId, isHandRaised }) => {
        useRoomStore.getState().updateParticipantState(participantId, { isHandRaised });
      })
    );

    cleanups.push(
      on('user:screen-changed', ({ participantId, isScreenSharing }) => {
        useRoomStore.getState().updateParticipantState(participantId, { isScreenSharing });
      })
    );

    cleanups.push(
      on('user:reaction', ({ participantId, emoji }) => {
        const key = useRoomStore.getState().showReaction(participantId, emoji);
        window.setTimeout(() => {
          useRoomStore.getState().clearReaction(participantId, key);
        }, 3000);
      })
    );

    cleanups.push(
      on('chat:message', ({ message }) => {
        useRoomStore.getState().addMessage(message);
      })
    );

    cleanups.push(
      on('room:error', ({ message }) => {
        setError(message);
        joiningRef.current = false;
      })
    );

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, [token, slug, navigate, on]);

  useEffect(() => {
    if (!token || !slug || joiningRef.current || joined) return;

    joiningRef.current = true;

    (async () => {
      try {
        await roomApi.join(slug);
        const messagesRes = await roomApi.messages(slug);
        useRoomStore.getState().setMessages(
          messagesRes.data.map((m: ChatMessage & { createdAt: string }) => ({
            ...m,
            createdAt:
              typeof m.createdAt === 'string'
                ? m.createdAt
                : new Date(m.createdAt).toISOString(),
          }))
        );
        emit('room:join', { roomSlug: slug, token });
      } catch (err) {
        joiningRef.current = false;
        setError(
          (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
            'Erreur de connexion'
        );
      }
    })();
  }, [token, slug, joined, emit]);

  useEffect(() => {
    return () => {
      joiningRef.current = false;
    };
  }, [slug]);

  return {
    joined,
    error,
    localSocketId,
    leaveRoom,
    user,
  };
}
