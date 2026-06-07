import { useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  MonitorOff,
  MessageSquare,
  Users,
  PhoneOff,
  Hand,
  Smile,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { ReactionsPicker } from './ReactionsPicker';
import type { ReactionEmoji } from '@mymeet/shared-types';
import { cn } from '@/lib/utils';

interface ControlsBarProps {
  isMuted: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  showChat: boolean;
  showParticipants: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleHand: () => void;
  onSendReaction: (emoji: ReactionEmoji) => void;
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  onLeave: () => void;
}

export function ControlsBar({
  isMuted,
  isVideoOn,
  isScreenSharing,
  isHandRaised,
  showChat,
  showParticipants,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onToggleHand,
  onSendReaction,
  onToggleChat,
  onToggleParticipants,
  onLeave,
}: ControlsBarProps) {
  const [showReactions, setShowReactions] = useState(false);

  return (
    <div className="flex items-center justify-center gap-2 border-t border-border bg-card/80 px-4 py-3 backdrop-blur">
      <ControlButton active={!isMuted} onClick={onToggleMute} label={isMuted ? 'Activer micro' : 'Couper micro'}>
        {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
      </ControlButton>

      <ControlButton active={isVideoOn} onClick={onToggleVideo} label={isVideoOn ? 'Couper caméra' : 'Activer caméra'}>
        {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
      </ControlButton>

      <ControlButton
        active={isScreenSharing}
        onClick={onToggleScreenShare}
        label={isScreenSharing ? 'Arrêter partage' : 'Partager écran'}
      >
        {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <MonitorUp className="h-5 w-5" />}
      </ControlButton>

      <ControlButton
        active={isHandRaised}
        onClick={onToggleHand}
        label={isHandRaised ? 'Baisser la main' : 'Lever la main'}
        className={isHandRaised ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' : undefined}
      >
        <Hand className={cn('h-5 w-5', isHandRaised && 'rotate-12')} />
      </ControlButton>

      <div className="relative">
        <ControlButton
          active={showReactions}
          onClick={() => setShowReactions((v) => !v)}
          label="Réactions"
        >
          <Smile className="h-5 w-5" />
        </ControlButton>
        <ReactionsPicker
          open={showReactions}
          onSelect={onSendReaction}
          onClose={() => setShowReactions(false)}
        />
      </div>

      <ControlButton active={showChat} onClick={onToggleChat} label="Chat">
        <MessageSquare className="h-5 w-5" />
      </ControlButton>

      <ControlButton active={showParticipants} onClick={onToggleParticipants} label="Participants">
        <Users className="h-5 w-5" />
      </ControlButton>

      <Button variant="destructive" size="icon" onClick={onLeave} title="Quitter">
        <PhoneOff className="h-5 w-5" />
      </Button>
    </div>
  );
}

function ControlButton({
  children,
  active,
  onClick,
  label,
  className,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
  label: string;
  className?: string;
}) {
  return (
    <Button
      variant={active ? 'secondary' : 'outline'}
      size="icon"
      onClick={onClick}
      title={label}
      className={cn(!active && 'opacity-70', className)}
    >
      {children}
    </Button>
  );
}
