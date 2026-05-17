import { Avatar } from './Avatar.jsx';
import { MicIndicator } from './MicIndicator.jsx';

/** `presentation` : cartes plus grandes (démo plein écran aveugle). */
export function ParticipantList({ participants = [], size = 'default' }) {
  const big = size === 'presentation';

  return (
    <div
      className={`rounded-2xl border border-[#DDE5EF] bg-[#FFFFFF] ${big ? 'rounded-3xl p-6 shadow-sm' : 'p-4'}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div
          className={`font-semibold text-[#1F2D4A] ${big ? 'text-xl' : 'text-sm'}`}
          style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}
        >
          Participants
        </div>
        <div
          className={`text-[#607089] ${big ? 'text-base' : 'text-xs'}`}
          style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
        >
          {participants.length}
        </div>
      </div>

      <div className={`${big ? 'mt-5 space-y-4' : 'mt-3 space-y-2'}`}>
        {participants.length === 0 ? (
          <div
            className={`text-[#607089] ${big ? 'text-lg' : 'text-sm'}`}
            style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}
          >
            En attente…
          </div>
        ) : (
          participants.map((p) => (
            <div
              key={p.socketId}
              className={`flex items-center justify-between rounded-2xl border border-[#DDE5EF] bg-[#F4F7FB] transition hover:border-[#C2CFE0] hover:bg-[#EBF1F9] ${
                big ? 'gap-4 rounded-3xl px-5 py-5' : 'px-3 py-2.5'
              }`}
            >
              <div className={`flex min-w-0 items-center ${big ? 'gap-5' : 'gap-3'}`}>
                <Avatar
                  name={p.name}
                  profile={p.profile}
                  size={big ? 'lg' : 'md'}
                  variant="circle"
                  photoUrl={p.photoUrl}
                />
                <div className="min-w-0">
                  <div
                    className={`truncate font-semibold text-[#1F2D4A] ${big ? 'text-xl' : 'text-sm'}`}
                    style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}
                  >
                    {p.name}
                  </div>
                  <div
                    className={`truncate text-[#607089] ${big ? 'mt-1 text-base capitalize' : 'text-xs'}`}
                    style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
                  >
                    {p.profile}
                  </div>
                </div>
              </div>
              <div className={`flex shrink-0 items-center ${big ? 'gap-3' : 'gap-2'}`}>
                {p.handRaised ? (
                  <div
                    className={`rounded-full border border-[#DDE5EF] bg-[#FFFFFF]/70 text-[#1F2D4A] ${big ? 'px-3 py-2 text-lg' : 'px-2 py-1 text-xs'}`}
                  >
                    🖐
                  </div>
                ) : null}
                <MicIndicator isSpeaking={Boolean(p.isSpeaking)} size={big ? 'lg' : 'sm'} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

