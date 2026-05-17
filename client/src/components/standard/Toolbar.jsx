import { Hand, Mic, MicOff, MonitorUp, Video, VideoOff } from 'lucide-react';

export function Toolbar({
  isMuted,
  videoEnabled,
  handRaised,
  onToggleMic,
  onToggleCamera,
  onToggleHand,
  onToggleScreenShare,
  isSharing,
  showMic = true,
  extraLeft = null,
}) {
  const Btn = ({ onClick, active, children, accent = false }) => (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition',
        accent
          ? 'border-transparent bg-[#3D8BF0] text-white hover:bg-[#2E76D8]'
          : active
            ? 'border-[#3D8BF0] bg-[#E6F0FB] text-[#1F5FBE]'
            : 'border-[#DDE5EF] bg-[#FFFFFF] text-[#607089] hover:bg-[#F4F7FB]',
      ].join(' ')}
      style={{
        fontFamily: "'Open Sans', system-ui, sans-serif",
        boxShadow: accent
          ? '0 8px 20px rgba(61,139,240,0.25)'
          : active
            ? '0 0 0 1px rgba(61,139,240,0.15)'
            : 'none',
      }}
    >
      {children}
    </button>
  );

  return (
    <div className="rounded-2xl border border-[#DDE5EF] bg-[#FFFFFF] p-4">
      <div className="flex flex-wrap items-center gap-2">
        {extraLeft}
        {showMic ? (
          <Btn onClick={onToggleMic} active={!isMuted}>
            {!isMuted ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            {!isMuted ? 'Micro ouvert' : 'Micro coupé'}
          </Btn>
        ) : null}
        <Btn onClick={onToggleCamera} active={videoEnabled}>
          {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          {videoEnabled ? 'Caméra' : 'Caméra coupée'}
        </Btn>
        <Btn onClick={onToggleHand} active={handRaised}>
          <Hand className="h-4 w-4" />
          {handRaised ? 'Main levée' : 'Lever la main'}
        </Btn>
        {onToggleScreenShare ? (
          <Btn onClick={onToggleScreenShare} active={Boolean(isSharing)} accent={!isSharing}>
            <MonitorUp className="h-4 w-4" />
            {isSharing ? 'Arrêter le partage' : 'Partager mon écran'}
          </Btn>
        ) : null}
      </div>
    </div>
  );
}

