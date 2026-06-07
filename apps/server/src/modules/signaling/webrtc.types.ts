import type { Participant, RoomState, ChatMessage } from '@mymeet/shared-types';

export interface SocketParticipant extends Participant {
  roomSlug: string;
}

export interface SignalingRoom {
  slug: string;
  roomId: string;
  participants: Map<string, SocketParticipant>;
}

export type { Participant, RoomState, ChatMessage };
