import type { SocketParticipant, SignalingRoom } from './webrtc.types';

class RoomManager {
  private rooms = new Map<string, SignalingRoom>();

  getOrCreate(slug: string, roomId: string): SignalingRoom {
    let room = this.rooms.get(slug);
    if (!room) {
      room = { slug, roomId, participants: new Map() };
      this.rooms.set(slug, room);
    }
    return room;
  }

  get(slug: string): SignalingRoom | undefined {
    return this.rooms.get(slug);
  }

  addParticipant(slug: string, participant: SocketParticipant) {
    const room = this.rooms.get(slug);
    if (room) {
      room.participants.set(participant.socketId, participant);
    }
  }

  removeParticipant(slug: string, socketId: string): SocketParticipant | undefined {
    const room = this.rooms.get(slug);
    if (!room) return undefined;
    const participant = room.participants.get(socketId);
    room.participants.delete(socketId);
    if (room.participants.size === 0) {
      this.rooms.delete(slug);
    }
    return participant;
  }

  getParticipants(slug: string): SocketParticipant[] {
    const room = this.rooms.get(slug);
    return room ? Array.from(room.participants.values()) : [];
  }

  updateParticipantState(
    slug: string,
    socketId: string,
    state: Partial<Pick<SocketParticipant, 'isMuted' | 'isVideoOn' | 'isScreenSharing' | 'isHandRaised'>>
  ) {
    const room = this.rooms.get(slug);
    const participant = room?.participants.get(socketId);
    if (participant) {
      Object.assign(participant, state);
    }
    return participant;
  }
}

export const roomManager = new RoomManager();
