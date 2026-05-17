import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

export function TranscriptionFeed({ lines = [], activeSpeakerId, scrollMaxClassName = 'max-h-[420px]' }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [lines.length]);

  return (
    <div className="rounded-2xl border border-[#DDE5EF] bg-[#FFFFFF] p-4">
      <div className="text-sm font-semibold text-[#1F2D4A]" style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}>
        Transcriptions
      </div>

      <div className={`mt-3 space-y-2 overflow-auto rounded-xl border border-[#DDE5EF] bg-[#F4F7FB] p-3 ${scrollMaxClassName}`}>
        {lines.length === 0 ? (
          <div className="text-sm text-[#607089]" style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}>
            En attente de parole…
          </div>
        ) : (
          lines.map((l) => {
            const isActive = activeSpeakerId && l.speakerId === activeSpeakerId;
            return (
              <motion.div
                key={l.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
                className={[
                  'rounded-xl border px-3 py-2',
                  isActive ? 'border-[#3D8BF0] bg-[#0b1420]' : 'border-[#DDE5EF] bg-[#FFFFFF]',
                ].join(' ')}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <div className="text-sm font-semibold text-[#1F2D4A]" style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}>
                    {l.speakerName}
                  </div>
                  <div className="text-xs text-[#607089]" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
                    {new Date(l.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                <div className="mt-1 text-sm text-[#1F2D4A]" style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}>
                  {l.text}
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}

