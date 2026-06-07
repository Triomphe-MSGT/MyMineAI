import { Server, Socket } from 'socket.io';
import { verifyToken } from '../../middleware/auth.middleware';
import { roomManager } from './room.manager';
import {
  joinRoom,
  leaveRoom,
  getRoomBySlug,
  createMessage,
  updateParticipantState,
} from '../room/room.service';
import { getUserById } from '../user/user.service';
import type { SocketParticipant } from './webrtc.types';
import type { RoomState } from '@mymeet/shared-types';

interface SocketData {
  userId: string;
  participantId?: string;
  roomSlug?: string;
}

function toParticipant(dbParticipant: {
  id: string;
  userId: string;
  socketId: string;
  isMuted: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  user: { id: string; name: string; avatar: string | null };
}): SocketParticipant {
  return {
    id: dbParticipant.id,
    userId: dbParticipant.userId,
    socketId: dbParticipant.socketId,
    name: dbParticipant.user.name,
    avatar: dbParticipant.user.avatar,
    isMuted: dbParticipant.isMuted,
    isVideoOn: dbParticipant.isVideoOn,
    isScreenSharing: dbParticipant.isScreenSharing,
    isHandRaised: false,
    roomSlug: '',
  };
}

function buildRoomState(slug: string, room: { id: string; name: string | null; maxParticipants: number }): RoomState {
  const participants = roomManager.getParticipants(slug).map(({ roomSlug: _, ...p }) => p);
  return {
    id: room.id,
    slug,
    name: room.name,
    maxParticipants: room.maxParticipants,
    participants,
  };
}

export function setupSignaling(io: Server) {
  io.on('connection', (socket: Socket) => {
    const data = socket.data as SocketData;

    socket.on('room:join', async ({ roomSlug, token }) => {
      try {
        const payload = verifyToken(token);
        if (!payload) {
          socket.emit('room:error', { message: 'Token invalide' });
          return;
        }

        const room = await getRoomBySlug(roomSlug);
        if (!room) {
          socket.emit('room:error', { message: 'Room introuvable' });
          return;
        }

        const dbParticipant = await joinRoom(roomSlug, payload.userId, socket.id);
        const participant: SocketParticipant = {
          ...toParticipant(dbParticipant),
          roomSlug,
        };

        data.userId = payload.userId;
        data.participantId = participant.id;
        data.roomSlug = roomSlug;

        roomManager.getOrCreate(roomSlug, room.id);
        roomManager.addParticipant(roomSlug, participant);
        socket.join(roomSlug);

        const roomState = buildRoomState(roomSlug, room);
        socket.emit('room:joined', { participant, room: roomState });

        socket.to(roomSlug).emit('room:user-joined', { participant });

        await createMessage(room.id, payload.userId, `${participant.name} a rejoint la room`);
      } catch (err) {
        socket.emit('room:error', { message: (err as Error).message });
      }
    });

    socket.on('room:leave', async ({ roomSlug }) => {
      await handleLeave(socket, roomSlug);
    });

    socket.on('webrtc:offer', ({ to, offer }) => {
      io.to(to).emit('webrtc:offer', { from: socket.id, offer });
    });

    socket.on('webrtc:answer', ({ to, answer }) => {
      io.to(to).emit('webrtc:answer', { from: socket.id, answer });
    });

    socket.on('webrtc:ice-candidate', ({ to, candidate }) => {
      io.to(to).emit('webrtc:ice-candidate', { from: socket.id, candidate });
    });

    socket.on('user:toggle-mute', async ({ isMuted }) => {
      await handleStateChange(socket, { isMuted });
    });

    socket.on('user:toggle-video', async ({ isVideoOn }) => {
      await handleStateChange(socket, { isVideoOn });
    });

    socket.on('user:toggle-screen-share', async ({ isScreenSharing }) => {
      const { roomSlug, participantId } = data;
      if (!roomSlug || !participantId) return;

      await updateParticipantState(participantId, { isScreenSharing });
      roomManager.updateParticipantState(roomSlug, socket.id, { isScreenSharing });
      io.to(roomSlug).emit('user:screen-changed', { participantId, isScreenSharing });
    });

    socket.on('user:toggle-hand', ({ isHandRaised }) => {
      const { roomSlug, participantId } = data;
      if (!roomSlug || !participantId) return;

      roomManager.updateParticipantState(roomSlug, socket.id, { isHandRaised });
      io.to(roomSlug).emit('user:hand-changed', { participantId, isHandRaised });
    });

    socket.on('user:reaction', ({ emoji }) => {
      const { roomSlug, participantId } = data;
      if (!roomSlug || !participantId || !emoji) return;

      const participant = roomManager.getParticipants(roomSlug).find((p) => p.id === participantId);
      io.to(roomSlug).emit('user:reaction', {
        participantId,
        name: participant?.name ?? 'Participant',
        emoji,
      });
    });

    socket.on('chat:message', async ({ content }) => {
      const { roomSlug, userId } = data;
      if (!roomSlug || !userId || !content.trim()) return;

      try {
        const room = await getRoomBySlug(roomSlug);
        if (!room) return;

        const message = await createMessage(room.id, userId, content.trim());
        io.to(roomSlug).emit('chat:message', {
          message: {
            ...message,
            createdAt: message.createdAt.toISOString(),
          },
        });
      } catch (err) {
        console.error('[chat:message]', err);
      }
    });

    socket.on('disconnect', async () => {
      const { roomSlug } = data;
      if (roomSlug) await handleLeave(socket, roomSlug);
    });

    async function handleStateChange(
      sock: Socket,
      state: { isMuted?: boolean; isVideoOn?: boolean }
    ) {
      const { roomSlug, participantId } = data;
      if (!roomSlug || !participantId) return;

      await updateParticipantState(participantId, state);
      roomManager.updateParticipantState(roomSlug, sock.id, state);

      sock.to(roomSlug).emit('user:state-changed', {
        participantId,
        isMuted: state.isMuted ?? false,
        isVideoOn: state.isVideoOn ?? true,
      });
    }

    async function handleLeave(sock: Socket, roomSlug: string) {
      const { participantId } = data;
      if (!participantId) return;

      const removed = roomManager.removeParticipant(roomSlug, sock.id);
      await leaveRoom(participantId);
      sock.leave(roomSlug);

      if (removed) {
        sock.to(roomSlug).emit('room:user-left', {
          participantId,
          socketId: sock.id,
        });

        const user = await getUserById(removed.userId);
        const room = await getRoomBySlug(roomSlug);
        if (room && user) {
          await createMessage(room.id, removed.userId, `${user.name} a quitté la room`);
        }
      }

      data.participantId = undefined;
      data.roomSlug = undefined;
    }
  });
}
