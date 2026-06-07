import { VideoTile } from './VideoTile';
import type { Participant } from '@mymeet/shared-types';
import type { ParticipantMedia } from '@/services/webrtc';
import type { ActiveReaction } from '@/stores/roomStore';
import { cn } from '@/lib/utils';

interface VideoGridProps {
  localMedia: ParticipantMedia;
  remoteMedia: Map<string, ParticipantMedia>;
  participants: Participant[];
  localSocketId: string;
  localName: string;
  localHandRaised: boolean;
  isMuted: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  reactions: Record<string, ActiveReaction>;
}

export function VideoGrid({
  localMedia,
  remoteMedia,
  participants,
  localSocketId,
  localName,
  localHandRaised,
  isMuted,
  isVideoOn,
  isScreenSharing,
  reactions,
}: VideoGridProps) {
  const count = participants.length || 1;

  const gridClass = cn(
    'grid h-full w-full gap-2 p-4',
    count === 1 && 'grid-cols-1',
    count === 2 && 'grid-cols-2',
    count <= 4 && count > 2 && 'grid-cols-2',
    count > 4 && 'grid-cols-3'
  );

  const localParticipant = participants.find((p) => p.socketId === localSocketId);

  return (
    <div className={gridClass}>
      <VideoTile
        cameraStream={localMedia.camera}
        screenStream={localMedia.screen}
        name={localName}
        isLocal
        isMuted={isMuted}
        isVideoOn={isVideoOn}
        isScreenSharing={isScreenSharing}
        isHandRaised={localHandRaised}
        reaction={localParticipant ? reactions[localParticipant.id]?.emoji ?? null : null}
        reactionKey={localParticipant ? reactions[localParticipant.id]?.key : undefined}
      />
      {participants
        .filter((p) => p.socketId !== localSocketId)
        .map((p) => {
          const media = remoteMedia.get(p.socketId) ?? { camera: null, screen: null };
          return (
            <VideoTile
              key={p.id}
              cameraStream={media.camera}
              screenStream={media.screen}
              name={p.name}
              isMuted={p.isMuted}
              isVideoOn={p.isVideoOn}
              isScreenSharing={p.isScreenSharing}
              isHandRaised={p.isHandRaised}
              reaction={reactions[p.id]?.emoji ?? null}
              reactionKey={reactions[p.id]?.key}
            />
          );
        })}
    </div>
  );
}
