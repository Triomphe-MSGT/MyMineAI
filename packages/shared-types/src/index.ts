export type MessageType = 'TEXT' | 'SYSTEM';

export interface Participant {
  id: string;
  userId: string;
  socketId: string;
  name: string;
  avatar?: string | null;
  isMuted: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
}

export type ReactionEmoji = '👍' | '👏' | '❤️' | '😂' | '😮' | '🎉';

export interface UserReaction {
  participantId: string;
  name: string;
  emoji: ReactionEmoji;
}

export interface RoomState {
  id: string;
  slug: string;
  name?: string | null;
  maxParticipants: number;
  participants: Participant[];
}

export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  content: string;
  type: MessageType;
  createdAt: string;
  user?: { id: string; name: string; avatar?: string | null };
}

export interface ClientEvents {
  'room:join': { roomSlug: string; token: string };
  'room:leave': { roomSlug: string };
  'webrtc:offer': { to: string; offer: RTCSessionDescriptionInit };
  'webrtc:answer': { to: string; answer: RTCSessionDescriptionInit };
  'webrtc:ice-candidate': { to: string; candidate: RTCIceCandidateInit };
  'user:toggle-mute': { isMuted: boolean };
  'user:toggle-video': { isVideoOn: boolean };
  'user:toggle-hand': { isHandRaised: boolean };
  'user:toggle-screen-share': { isScreenSharing: boolean };
  'user:reaction': { emoji: ReactionEmoji };
  'chat:message': { content: string };
}

export interface ServerEvents {
  'room:joined': { participant: Participant; room: RoomState };
  'room:user-joined': { participant: Participant };
  'room:user-left': { participantId: string; socketId: string };
  'webrtc:offer': { from: string; offer: RTCSessionDescriptionInit };
  'webrtc:answer': { from: string; answer: RTCSessionDescriptionInit };
  'webrtc:ice-candidate': { from: string; candidate: RTCIceCandidateInit };
  'user:state-changed': { participantId: string; isMuted: boolean; isVideoOn: boolean };
  'user:hand-changed': { participantId: string; isHandRaised: boolean };
  'user:screen-changed': { participantId: string; isScreenSharing: boolean };
  'user:reaction': UserReaction;
  'chat:message': { message: ChatMessage };
  'room:error': { message: string };
}
