import { useEffect, useRef } from 'react';

export function ScreenShareOverlay({
  isActive,
  screenStream,
  latestDescription,
  presenterNote,
  presenterProfile,
  participants = [],
  /** `contained` : overlay limité au parent `relative` (démo multi-colonnes). */
  placement = 'fullscreen',
}) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.srcObject = screenStream || null;
  }, [screenStream]);

  if (!isActive) return null;

  const hasBlind = participants.some((p) => p?.profile === 'blind');
  const wrapClass = placement === 'contained' ? 'absolute inset-0 z-30' : 'fixed inset-0 z-50';

  return (
    <div className={`${wrapClass} bg-[#FFFFFF]/90 backdrop-blur`}>
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-4 px-6 py-6 lg:flex-row">
        <div className="flex-1 overflow-hidden rounded-2xl border border-[#DDE5EF] bg-[#FFFFFF]">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video ref={videoRef} autoPlay playsInline className="h-full w-full object-contain" />
        </div>

        <div className="w-full max-w-lg space-y-3 rounded-2xl border border-[#DDE5EF] bg-[#FFFFFF] p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-[#1F2D4A]" style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}>
              Panneau IA
            </div>
            {hasBlind ? (
              <div
                className="rounded-full bg-[#0b1420] px-3 py-1 text-xs font-semibold text-[#3D8BF0]"
                style={{ fontFamily: "'Open Sans', system-ui, sans-serif", boxShadow: '0 0 20px rgba(61,139,240,0.18)' }}
              >
                🔊 Envoyé à Bob
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border border-[#DDE5EF] bg-[#F4F7FB] p-3">
            <div className="text-xs text-[#607089]" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
              Description
            </div>
            <div className="mt-2 text-sm text-[#1F2D4A]" style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}>
              {latestDescription || 'Description en cours...'}
            </div>

            {presenterNote ? (
              <div className="mt-3 border-t border-[#DDE5EF] pt-3">
                <div className="text-xs text-[#607089]" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
                  {presenterProfile === 'deaf' ? 'Présentateur (texte) :' : 'Note du présentateur :'}
                </div>
                <div className="mt-1 text-sm italic text-[#1F5FBE]" style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}>
                  « {presenterNote} »
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

