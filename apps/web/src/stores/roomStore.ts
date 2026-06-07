import { create } from 'zustand';
import type { Participant, RoomState, ChatMessage, ReactionEmoji } from '@mymeet/shared-types';

export interface ActiveReaction {
  emoji: ReactionEmoji;
  key: number;
}

interface RoomStoreState {
  room: RoomState | null;
  localParticipant: Participant | null;
  messages: ChatMessage[];
  reactions: Record<string, ActiveReaction>;
  showChat: boolean;
  showParticipants: boolean;
  setRoom: (room: RoomState, localParticipant: Participant) => void;
  addParticipant: (participant: Participant) => void;
  removeParticipant: (participantId: string) => void;
  updateParticipantState: (participantId: string, state: Partial<Participant>) => void;
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  showReaction: (participantId: string, emoji: ReactionEmoji) => number;
  clearReaction: (participantId: string, key: number) => void;
  toggleChat: () => void;
  toggleParticipants: () => void;
  reset: () => void;
}

export const useRoomStore = create<RoomStoreState>((set) => ({
  room: null,
  localParticipant: null,
  messages: [],
  reactions: {},
  showChat: false,
  showParticipants: false,

  setRoom: (room, localParticipant) =>
    set({
      room: {
        ...room,
        participants: room.participants.map((p) => ({
          ...p,
          isHandRaised: p.isHandRaised ?? false,
          isScreenSharing: p.isScreenSharing ?? false,
        })),
      },
      localParticipant: {
        ...localParticipant,
        isHandRaised: localParticipant.isHandRaised ?? false,
      },
    }),

  addParticipant: (participant) =>
    set((state) => {
      if (!state.room) return state;
      const exists = state.room.participants.some((p) => p.id === participant.id);
      if (exists) return state;
      return {
        room: {
          ...state.room,
          participants: [...state.room.participants, { ...participant, isHandRaised: participant.isHandRaised ?? false }],
        },
      };
    }),

  removeParticipant: (participantId) =>
    set((state) => {
      if (!state.room) return state;
      const { [participantId]: _, ...reactions } = state.reactions;
      return {
        reactions,
        room: {
          ...state.room,
          participants: state.room.participants.filter((p) => p.id !== participantId),
        },
      };
    }),

  updateParticipantState: (participantId, updates) =>
    set((state) => {
      if (!state.room) return state;
      return {
        room: {
          ...state.room,
          participants: state.room.participants.map((p) =>
            p.id === participantId ? { ...p, ...updates } : p
          ),
        },
        localParticipant:
          state.localParticipant?.id === participantId
            ? { ...state.localParticipant, ...updates }
            : state.localParticipant,
      };
    }),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  setMessages: (messages) => set({ messages }),

  showReaction: (participantId, emoji) => {
    const key = Date.now();
    set((state) => ({
      reactions: {
        ...state.reactions,
        [participantId]: { emoji, key },
      },
    }));
    return key;
  },

  clearReaction: (participantId, key) =>
    set((state) => {
      const current = state.reactions[participantId];
      if (!current || current.key !== key) return state;
      const { [participantId]: _, ...reactions } = state.reactions;
      return { reactions };
    }),

  toggleChat: () => set((state) => ({ showChat: !state.showChat })),

  toggleParticipants: () =>
    set((state) => ({ showParticipants: !state.showParticipants })),

  reset: () =>
    set({
      room: null,
      localParticipant: null,
      messages: [],
      reactions: {},
      showChat: false,
      showParticipants: false,
    }),
}));
