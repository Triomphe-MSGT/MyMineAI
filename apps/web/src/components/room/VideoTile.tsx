import { useEffect, useRef } from 'react';
import { Hand, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import type { ReactionEmoji } from '@mymeet/shared-types';
import { buildPlaybackStreams } from '@/services/webrtc';
import { cn } from '@/lib/utils';

interface VideoTileProps {
  cameraStream?: MediaStream | null;
  screenStream?: MediaStream | null;
  name: string;
  isLocal?: boolean;
  isMuted?: boolean;
  isVideoOn?: boolean;
  isScreenSharing?: boolean;
  isHandRaised?: boolean;
  reaction?: ReactionEmoji | null;
  reactionKey?: number;
}

export function VideoTile({
  cameraStream = null,
  screenStream = null,
  name,
  isLocal = false,
  isMuted = false,
  isVideoOn = true,
  isScreenSharing = false,
  isHandRaised = false,
  reaction = null,
  reactionKey,
}: VideoTileProps) {
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const pipVideoRef = useRef<HTMLVideoElement>(null);

  const { main, pip } = buildPlaybackStreams(cameraStream, screenStream, isScreenSharing);

  useEffect(() => {
    const video = mainVideoRef.current;
    if (!video) return;
    if (main) {
      video.srcObject = main;
      video.play().catch(() => {});
    } else {
      video.srcObject = null;
    }
  }, [main]);

  useEffect(() => {
    const video = pipVideoRef.current;
    if (!video) return;
    if (pip) {
      video.srcObject = pip;
      video.play().catch(() => {});
    } else {
      video.srcObject = null;
    }
  }, [pip]);

  const showMainVideo = main && (isScreenSharing || isVideoOn);
  const showPip = pip && isScreenSharing && isVideoOn;

  return (
    <div
      className={cn(
        'relative aspect-video overflow-hidden rounded-lg bg-secondary',
        isLocal && 'ring-2 ring-primary',
        isHandRaised && 'ring-2 ring-yellow-400',
        isScreenSharing && 'ring-2 ring-blue-500/60'
      )}
    >
      {main && (
        <video
          ref={mainVideoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={cn(
            'h-full w-full',
            isScreenSharing ? 'object-contain bg-black' : 'object-cover',
            !showMainVideo && 'sr-only'
          )}
        />
      )}

      {!showMainVideo && (
        <div className="absolute inset-0 flex h-full w-full items-center justify-center bg-secondary">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-2xl font-bold text-primary">
            {name.charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      {showPip && (
        <div className="absolute bottom-3 right-3 z-10 h-24 w-36 overflow-hidden rounded-lg border-2 border-primary shadow-lg">
          <video
            ref={pipVideoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {isHandRaised && (
        <div className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500 text-yellow-950 shadow-lg">
          <Hand className="h-4 w-4 rotate-12" />
        </div>
      )}

      {reaction && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <span key={reactionKey} className="animate-bounce text-5xl drop-shadow-lg">
            {reaction}
          </span>
        </div>
      )}

      <div className="absolute bottom-2 left-2 z-10 flex items-center gap-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
        <span>{isLocal ? `${name} (vous)` : name}</span>
        {isScreenSharing && <span className="text-primary">Écran</span>}
        {isHandRaised && <span className="text-yellow-400">Main levée</span>}
        {isMuted ? (
          <MicOff className="h-3 w-3 text-destructive" />
        ) : (
          <Mic className="h-3 w-3" />
        )}
        {!isVideoOn && !isScreenSharing && (
          <VideoOff className="h-3 w-3 text-muted-foreground" />
        )}
      </div>
    </div>
  );
}
