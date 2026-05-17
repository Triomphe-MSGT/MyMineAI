import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, Volume1, Volume2, VolumeX } from 'lucide-react';
import { VoiceAssistantPanel } from './VoiceAssistantPanel.jsx';
import { ParticipantList } from '../shared/ParticipantList.jsx';

/**
 * @param {object} props
 * @param {'default'|'fullscreen'} [props.layoutVariant]
 * @param {{ selfSpeaking?: boolean; othersSpeaking?: boolean }} [props.demoAudioReactivity] — démo / UX : micro animé, VU à l’écoute
 */
export function BlindLayout({
  speak,
  messages,
  participants,
  updateMyState,
  toggleMic,
  transcriptionLines,
  layoutVariant = 'default',
  demoAudioReactivity,
}) {
  const [events, setEvents] = useState([]);
  const [volume, setVolume] = useState(0.9);
  const [listenEnvelope, setListenEnvelope] = useState(0);

  const selfSpeaking = Boolean(demoAudioReactivity?.selfSpeaking);
  const othersSpeaking = Boolean(demoAudioReactivity?.othersSpeaking);
  const isFullscreen = layoutVariant === 'fullscreen';

  useEffect(() => {
    if (!othersSpeaking) {
      setListenEnvelope(0);
      return undefined;
    }
    let raf;
    const tick = (t) => {
      const wobble = 0.42 + 0.58 * (0.5 + 0.5 * Math.sin(t / 130)) * (0.5 + 0.5 * Math.sin(t / 210));
      setListenEnvelope(wobble);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [othersSpeaking]);

  const addEvent = useCallback((text) => {
    setEvents((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, text, timestamp: Date.now() },
    ]);
  }, []);

  const speakWithVolume = useCallback(
    (text, priority, options) => {
      speak?.(text, priority, { ...(options || {}), volume });
    },
    [speak, volume],
  );

  const VolumeIcon = useMemo(() => {
    if (volume <= 0) return VolumeX;
    if (volume < 0.6) return Volume1;
    return Volume2;
  }, [volume]);

  const lastTranscripts = useMemo(() => {
    const lines = Array.isArray(transcriptionLines) ? transcriptionLines : [];
    return lines.slice(-6);
  }, [transcriptionLines]);

  const vuHeights = useMemo(() => {
    const n = 6;
    if (!othersSpeaking) return Array.from({ length: n }, () => 14);
    const cap = volume;
    return Array.from({ length: n }, (_, i) => {
      const phase = (i * 0.55 + listenEnvelope * 2.1) % 1;
      const h = 10 + listenEnvelope * cap * (38 + i * 10) * (0.55 + 0.45 * Math.sin(phase * Math.PI * 2));
      return Math.round(h);
    });
  }, [othersSpeaking, listenEnvelope, volume]);

  const rootClass = isFullscreen
    ? 'flex min-h-0 flex-1 flex-col px-5 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10'
    : 'min-h-screen w-full px-6 py-10';

  const gridClass = isFullscreen
    ? 'mx-auto grid min-h-0 w-full max-w-[1800px] flex-1 grid-cols-1 gap-8 xl:grid-cols-[minmax(22rem,38vw)_minmax(0,1fr)] xl:gap-10 2xl:grid-cols-[minmax(28rem,520px)_minmax(0,1fr)]'
    : 'mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]';

  const mainPanelClass = isFullscreen
    ? 'flex min-h-[min(520px,45vh)] flex-1 items-center justify-center rounded-3xl border-2 border-[#DDE5EF] bg-[#FFFFFF] px-6 py-10 shadow-sm xl:min-h-0'
    : 'flex min-h-[520px] items-center justify-center rounded-3xl border border-[#DDE5EF] bg-[#FFFFFF]';

  const micWrapClass = isFullscreen ? 'h-64 w-64 rounded-[2.85rem] sm:h-72 sm:w-72 sm:rounded-[3rem] lg:h-80 lg:w-80' : 'h-48 w-48 rounded-[2.5rem]';
  const micIconClass = isFullscreen ? 'h-32 w-32 sm:h-36 sm:w-36 lg:h-40 lg:w-40' : 'h-24 w-24';

  return (
    <div className={rootClass} style={{ backgroundColor: '#FFFFFF', color: '#1F2D4A' }}>
      {/* L'assistant vocal reste actif, mais l'UI est volontairement minimaliste (audio-first). */}
      <div className="sr-only">
        <VoiceAssistantPanel
          speak={speakWithVolume}
          addEvent={addEvent}
          messages={messages}
          participants={participants}
          updateMyState={updateMyState}
          toggleMic={toggleMic}
          transcriptionLines={transcriptionLines}
        />
        <pre>{JSON.stringify(events.slice(-5), null, 2)}</pre>
      </div>

      <div className={gridClass}>
        <div className={`min-h-0 space-y-4 ${isFullscreen ? 'space-y-6 xl:max-h-full xl:overflow-y-auto xl:pr-1' : ''}`}>
          <ParticipantList participants={participants} size={isFullscreen ? 'presentation' : 'default'} />

          <div
            className={`rounded-2xl border border-[#DDE5EF] bg-[#FFFFFF] ${isFullscreen ? 'rounded-3xl border-2 p-6 shadow-sm' : 'p-4'}`}
          >
            <div
              className={`font-semibold text-[#1F2D4A] ${isFullscreen ? 'text-xl' : 'text-sm'}`}
              style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}
            >
              Transcription (log)
            </div>
            <div
              className={`mt-3 space-y-2 overflow-auto rounded-xl border border-[#DDE5EF] bg-[#F4F7FB] ${
                isFullscreen ? 'max-h-[min(50vh,480px)] space-y-3 p-5 text-base leading-relaxed xl:max-h-[min(55vh,560px)]' : 'max-h-56 p-3'
              }`}
            >
              {lastTranscripts.length === 0 ? (
                <div
                  className={`text-[#607089] ${isFullscreen ? 'text-lg' : 'text-sm'}`}
                  style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}
                >
                  En attente…
                </div>
              ) : (
                lastTranscripts.map((l) => (
                  <div
                    key={l.id}
                    className={`text-[#1F2D4A] ${isFullscreen ? 'text-base leading-snug' : 'text-xs'}`}
                    style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
                  >
                    <span className={isFullscreen ? 'text-[#607089] font-semibold' : 'text-[#607089]'}>{l.speakerName}:</span> {l.text}
                  </div>
                ))
              )}
            </div>
            <div
              className={`text-[#A0ABBD] ${isFullscreen ? 'mt-3 text-base' : 'mt-2 text-xs'}`}
              style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}
            >
              Affiché pour enregistrement & résumé.
            </div>
          </div>
        </div>

        <div className={mainPanelClass}>
          <div className={`flex flex-col items-center ${isFullscreen ? 'gap-10' : 'gap-6'}`}>
            <motion.div
              role="button"
              tabIndex={0}
              onClick={() => speakWithVolume("Je t'écoute.", 'system')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') speakWithVolume("Je t'écoute.", 'system');
              }}
              className={`grid place-items-center border border-[#DDE5EF] bg-[#F4F7FB] ${micWrapClass}`}
              style={{ boxShadow: '0 0 20px rgba(61,139,240,0.18)' }}
              animate={
                selfSpeaking
                  ? { scale: [1, 1.07, 1], y: [0, -3, 0], rotate: [-1.2, 1.2, -1.2] }
                  : { scale: 1, y: 0, rotate: 0 }
              }
              transition={
                selfSpeaking ? { repeat: Infinity, duration: 0.78, ease: 'easeInOut' } : { duration: 0.25, ease: 'easeOut' }
              }
            >
              <Mic className={`text-[#3D8BF0] ${micIconClass}`} />
            </motion.div>

            <div className={`flex flex-col items-center ${isFullscreen ? 'gap-4' : 'gap-2'}`}>
              <div className={`flex items-center ${isFullscreen ? 'gap-5' : 'gap-3'}`}>
                <button
                  type="button"
                  onClick={() => setVolume((v) => Math.max(0, Math.round((v - 0.1) * 10) / 10))}
                  className={`rounded-2xl border border-[#DDE5EF] bg-[#F4F7FB] font-semibold text-[#1F2D4A] ${
                    isFullscreen ? 'min-h-[3.25rem] min-w-[3.25rem] rounded-3xl border-2 px-6 py-4 text-2xl' : 'px-4 py-3 text-sm'
                  }`}
                  style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}
                  aria-label="Diminuer le volume"
                >
                  −
                </button>

                <div
                  className={`flex items-center rounded-2xl border border-[#DDE5EF] bg-[#F4F7FB] ${
                    isFullscreen ? 'gap-4 rounded-3xl border-2 px-6 py-4' : 'gap-3 px-4 py-3'
                  }`}
                >
                  <div
                    className={`flex items-end justify-center gap-1 ${isFullscreen ? 'h-14 gap-1.5' : 'h-11'}`}
                    aria-hidden
                    title={othersSpeaking ? 'Niveau à l’écoute (démo)' : undefined}
                  >
                    {vuHeights.map((hPx, idx) => (
                      <motion.div
                        key={idx}
                        className={`rounded-sm bg-[#3D8BF0] ${isFullscreen ? 'w-2.5' : 'w-1.5'}`}
                        animate={{ height: isFullscreen ? hPx * 1.25 : hPx }}
                        transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                      />
                    ))}
                  </div>
                  <VolumeIcon className={`shrink-0 text-[#1F2D4A] ${isFullscreen ? 'h-8 w-8' : 'h-5 w-5'}`} />
                  <div
                    className={`text-[#607089] ${isFullscreen ? 'text-2xl font-medium tabular-nums' : 'text-sm'}`}
                    style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
                  >
                    {Math.round(volume * 100)}%
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setVolume((v) => Math.min(1, Math.round((v + 0.1) * 10) / 10))}
                  className={`rounded-2xl border border-[#DDE5EF] bg-[#F4F7FB] font-semibold text-[#1F2D4A] ${
                    isFullscreen ? 'min-h-[3.25rem] min-w-[3.25rem] rounded-3xl border-2 px-6 py-4 text-2xl' : 'px-4 py-3 text-sm'
                  }`}
                  style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}
                  aria-label="Augmenter le volume"
                >
                  +
                </button>
              </div>
              {othersSpeaking ? (
                <p
                  className={`text-center text-[#607089] ${isFullscreen ? 'max-w-md text-base' : 'text-xs'}`}
                  style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}
                >
                  Écoute — niveau lié au volume réglé (démo)
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
