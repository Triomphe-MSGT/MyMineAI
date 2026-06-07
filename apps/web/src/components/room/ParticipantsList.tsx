import { X, Mic, MicOff, Video, VideoOff, Hand } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { useRoomStore } from '@/stores/roomStore';

interface ParticipantsListProps {
  onClose: () => void;
  localSocketId: string;
}

export function ParticipantsList({ onClose, localSocketId }: ParticipantsListProps) {
  const { room } = useRoomStore();
  const participants = room?.participants ?? [];

  return (
    <aside className="flex w-72 flex-col border-l border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="font-semibold">
          Participants ({participants.length})
        </h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ul className="flex-1 overflow-y-auto p-3 space-y-2">
        {participants.map((p) => (
          <li
            key={p.id}
            className="flex items-center gap-3 rounded-md bg-secondary/50 px-3 py-2 text-sm"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 font-medium text-primary">
              {p.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-medium">
                {p.name}
                {p.socketId === localSocketId && (
                  <span className="ml-1 text-xs text-muted-foreground">(vous)</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {p.isHandRaised && (
                <Hand className="h-4 w-4 text-yellow-400" title="Main levée" />
              )}
              {p.isMuted ? (
                <MicOff className="h-4 w-4 text-destructive" />
              ) : (
                <Mic className="h-4 w-4 text-muted-foreground" />
              )}
              {!p.isVideoOn ? (
                <VideoOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Video className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
