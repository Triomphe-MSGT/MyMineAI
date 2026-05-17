import { useMemo } from 'react';
import { Users } from 'lucide-react';
import { VideoTile } from './VideoTile.jsx';
import { socket } from '../../socket.js';

const DEFAULT_LOCAL_TILE = { name: 'Vous', profile: 'standard', isMuted: false, videoEnabled: true, isSpeaking: false };

export function VideoGrid({
  participants = [],
  localStream,
  remoteStreams,
  localTileParticipant,
  /** Pour lister tous les participants distants même sans flux WebRTC (vue galerie type Zoom). */
  localSocketId,
}) {
  const localSid = localSocketId ?? socket.id;

  const remoteTiles = useMemo(() => {
    const tiles = [];
    for (const p of participants) {
      if (!p?.socketId || p.socketId === localSid) continue;
      const stream = remoteStreams?.get?.(p.socketId) ?? null;
      tiles.push({ socketId: p.socketId, participant: p, stream });
    }
    return tiles;
  }, [participants, remoteStreams, localSid]);

  const totalTiles = 1 + remoteTiles.length;
  const cols = Math.min(5, Math.max(2, Math.ceil(Math.sqrt(totalTiles))));

  return (
    <div className="rounded-2xl border border-[#DDE5EF] bg-[#F4F7FB] p-4">
      <div className="mb-3 flex items-center gap-2 border-b border-[#DDE5EF] pb-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#E6F0FB]">
          <Users className="h-4 w-4 text-[#1F5FBE]" aria-hidden />
        </div>
        <div>
          <div className="text-sm font-bold text-[#1F2D4A]" style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}>
            Galerie
          </div>
          <div className="text-[11px] text-[#607089]" style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}>
            Photo de profil sur chaque vignette · caméra masquée si la vidéo est coupée
          </div>
        </div>
      </div>

      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        }}
      >
        <VideoTile
          isLocal
          stream={localStream}
          participant={localTileParticipant && typeof localTileParticipant === 'object' ? localTileParticipant : DEFAULT_LOCAL_TILE}
        />

        {remoteTiles.map(({ socketId, participant, stream }) => (
          <VideoTile key={socketId} stream={stream} participant={participant} />
        ))}
      </div>
    </div>
  );
}
