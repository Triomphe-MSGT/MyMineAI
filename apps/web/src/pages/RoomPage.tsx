import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { VideoGrid } from '@/components/room/VideoGrid';
import { ControlsBar } from '@/components/room/ControlsBar';
import { ChatPanel } from '@/components/room/ChatPanel';
import { ParticipantsList } from '@/components/room/ParticipantsList';
import { ScreenShareIndicator } from '@/components/room/ScreenShare';
import { useRoom } from '@/hooks/useRoom';
import { useMedia } from '@/hooks/useMedia';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useRoomStore } from '@/stores/roomStore';
import { useUserStore } from '@/stores/userStore';
import { useSocket } from '@/hooks/useSocket';
import type { ReactionEmoji } from '@mymeet/shared-types';
import type { ParticipantMedia } from '@/services/webrtc';

export function RoomPage() {
  const { slug = '' } = useParams();
  const { token } = useUserStore();
  const {
    room,
    localParticipant,
    reactions,
    showChat,
    showParticipants,
    toggleChat,
    toggleParticipants,
    updateParticipantState,
  } = useRoomStore();
  const { joined, error, localSocketId, leaveRoom, user } = useRoom(slug);
  const { emit } = useSocket();

  const {
    localStream,
    screenStream,
    isMuted,
    isVideoOn,
    isScreenSharing,
    initMedia,
    toggleMute,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    cleanup: cleanupMedia,
  } = useMedia();

  const [remoteMedia, setRemoteMedia] = useState<Map<string, ParticipantMedia>>(new Map());

  const onRemoteStreams = useCallback((socketId: string, media: ParticipantMedia) => {
    setRemoteMedia((prev) => new Map(prev).set(socketId, media));
  }, []);

  const onRemoteStreamRemoved = useCallback((socketId: string) => {
    setRemoteMedia((prev) => {
      const next = new Map(prev);
      next.delete(socketId);
      return next;
    });
  }, []);

  const { connectToExistingPeers, cleanup: cleanupWebRTC } = useWebRTC({
    cameraStream: localStream,
    screenStream,
    roomSlug: slug,
    token: token || '',
    localSocketId,
    onRemoteStreams,
    onRemoteStreamRemoved,
  });

  useEffect(() => {
    if (joined) initMedia();
  }, [joined, initMedia]);

  useEffect(() => {
    if (!localParticipant || isScreenSharing || !localParticipant.isScreenSharing) return;
    updateParticipantState(localParticipant.id, { isScreenSharing: false });
    emit('user:toggle-screen-share', { isScreenSharing: false });
  }, [isScreenSharing, localParticipant, updateParticipantState, emit]);

  useEffect(() => {
    if (joined && room && localSocketId) {
      const otherSocketIds = room.participants
        .filter((p) => p.socketId !== localSocketId)
        .map((p) => p.socketId);
      connectToExistingPeers(otherSocketIds);
    }
  }, [joined, room, localSocketId, connectToExistingPeers]);

  const handleToggleMute = () => {
    const muted = toggleMute();
    emit('user:toggle-mute', { isMuted: muted });
  };

  const handleToggleVideo = () => {
    const videoOn = toggleVideo();
    emit('user:toggle-video', { isVideoOn: videoOn });
  };

  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      stopScreenShare();
      if (localParticipant) {
        updateParticipantState(localParticipant.id, { isScreenSharing: false });
      }
      emit('user:toggle-screen-share', { isScreenSharing: false });
    } else {
      const started = await startScreenShare();
      if (started && localParticipant) {
        updateParticipantState(localParticipant.id, { isScreenSharing: true });
        emit('user:toggle-screen-share', { isScreenSharing: true });
      }
    }
  };

  const handleToggleHand = () => {
    if (!localParticipant) return;
    const isHandRaised = !localParticipant.isHandRaised;
    updateParticipantState(localParticipant.id, { isHandRaised });
    emit('user:toggle-hand', { isHandRaised });
  };

  const handleSendReaction = (emoji: ReactionEmoji) => {
    emit('user:reaction', { emoji });
  };

  const handleLeave = () => {
    cleanupWebRTC();
    cleanupMedia();
    leaveRoom();
  };

  if (error) {
    return (
      <AppLayout>
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-destructive">{error}</p>
        </div>
      </AppLayout>
    );
  }

  if (!joined || !room) {
    return (
      <AppLayout hideNav>
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-muted-foreground">Connexion à la room...</p>
        </div>
      </AppLayout>
    );
  }

  const localMedia: ParticipantMedia = {
    camera: localStream,
    screen: screenStream,
  };

  return (
    <AppLayout hideNav>
      <div className="flex h-screen flex-col">
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <div>
            <h1 className="font-semibold">{room.name || `Room ${room.slug}`}</h1>
            <p className="text-xs text-muted-foreground">
              {room.participants.length} participant{room.participants.length > 1 ? 's' : ''}
            </p>
          </div>
          <code className="rounded bg-secondary px-2 py-1 text-xs">{room.slug}</code>
        </div>

        <div className="relative flex flex-1 overflow-hidden">
          <div className="relative flex-1">
            <ScreenShareIndicator active={isScreenSharing} />
            <VideoGrid
              localMedia={localMedia}
              remoteMedia={remoteMedia}
              participants={room.participants}
              localSocketId={localSocketId}
              localName={user?.name || 'Vous'}
              localHandRaised={localParticipant?.isHandRaised ?? false}
              isMuted={isMuted}
              isVideoOn={isVideoOn}
              isScreenSharing={isScreenSharing}
              reactions={reactions}
            />
          </div>

          {showChat && <ChatPanel onClose={toggleChat} />}
          {showParticipants && (
            <ParticipantsList onClose={toggleParticipants} localSocketId={localSocketId} />
          )}
        </div>

        <ControlsBar
          isMuted={isMuted}
          isVideoOn={isVideoOn}
          isScreenSharing={isScreenSharing}
          isHandRaised={localParticipant?.isHandRaised ?? false}
          showChat={showChat}
          showParticipants={showParticipants}
          onToggleMute={handleToggleMute}
          onToggleVideo={handleToggleVideo}
          onToggleScreenShare={handleToggleScreenShare}
          onToggleHand={handleToggleHand}
          onSendReaction={handleSendReaction}
          onToggleChat={toggleChat}
          onToggleParticipants={toggleParticipants}
          onLeave={handleLeave}
        />
      </div>
    </AppLayout>
  );
}
