import { useEffect, useMemo, useRef } from 'react';
import { VideoOff } from 'lucide-react';
import { MicIndicator } from '../shared/MicIndicator.jsx';
import { Avatar } from '../shared/Avatar.jsx';

function hasLiveVideoTrack(stream) {
  if (!stream || typeof stream.getVideoTracks !== 'function') return false;
  return stream.getVideoTracks().some((t) => t.readyState === 'live' && t.enabled);
}

export function VideoTile({ stream, participant, isLocal = false }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.srcObject = stream || null;
  }, [stream]);

  const name = participant?.name || 'Participant';
  const isSpeaking = Boolean(participant?.isSpeaking);
  const handRaised = Boolean(participant?.handRaised);
  const videoOff = participant?.videoEnabled === false;

  const showProfile = useMemo(() => {
    if (videoOff) return true;
    return !hasLiveVideoTrack(stream);
  }, [stream, videoOff]);

  const profileLabel =
    participant?.profile === 'blind'
      ? 'Aveugle'
      : participant?.profile === 'deaf'
        ? 'Sourd · muet'
        : 'Standard';

  return (
    <div
      className="relative overflow-hidden rounded-xl border-2 border-[#C8D4E6] bg-[#1a1d21] shadow-[0_8px_24px_rgba(15,23,42,0.12)]"
      style={{ boxShadow: '0 8px 24px rgba(15,23,42,0.12), inset 0 0 0 1px rgba(255,255,255,0.06)' }}
    >
      <div className="relative aspect-video w-full bg-[#232629]">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ${
            showProfile ? 'opacity-0' : 'opacity-100'
          }`}
        />

        {showProfile ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-3 pb-14 pt-4">
            <Avatar name={name} profile={participant?.profile} size="xl" variant="circle" photoUrl={participant?.photoUrl} />
            <div className="text-center">
              <div className="truncate text-base font-semibold text-white drop-shadow-sm" style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}>
                {name}
              </div>
              <div className="mt-0.5 flex items-center justify-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-white/75" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
                <VideoOff className="h-3.5 w-3.5 shrink-0 text-white/80" aria-hidden />
                {profileLabel}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/75 via-black/45 to-transparent px-3 pb-2 pt-10">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar name={name} profile={participant?.profile} size="sm" variant="circle" photoUrl={participant?.photoUrl} />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white drop-shadow" style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}>
              {name}
            </div>
            <div className="truncate text-[11px] text-white/75" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
              {participant?.profile || 'standard'}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {handRaised ? (
            <div className="rounded-full border border-white/25 bg-white/15 px-2 py-1 text-xs text-white">
              🖐
            </div>
          ) : null}
          <MicIndicator isSpeaking={isSpeaking} dark />
        </div>
      </div>
    </div>
  );
}
