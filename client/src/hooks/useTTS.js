import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

function normalizePriority(priority) {
  if (typeof priority === 'number' && Number.isFinite(priority)) return priority;
  if (priority === 'description') return 3;
  if (priority === 'system') return 2;
  if (priority === 'transcription') return 1;
  if (priority === 'high') return 2;
  if (priority === 'low') return 0;
  return 1;
}

export function useTTS() {
  const apiKey = useMemo(() => import.meta.env.VITE_ELEVENLABS_API_KEY || '', []);
  const voiceId = useMemo(() => import.meta.env.VITE_ELEVENLABS_VOICE_ID || '', []);
  const canUseElevenLabs = Boolean(apiKey && voiceId);

  const queueRef = useRef([]); // [{ id, text, priority }]
  const speakingRef = useRef(false);
  const drainingRef = useRef(false);
  const audioRef = useRef(null);
  const utteranceRef = useRef(null);
  const configRef = useRef({ apiKey, voiceId, canUseElevenLabs });

  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    configRef.current = { apiKey, voiceId, canUseElevenLabs };
  }, [apiKey, canUseElevenLabs, voiceId]);

  const setSpeaking = useCallback((v) => {
    speakingRef.current = v;
    setIsSpeaking(v);
  }, []);

  const stop = useCallback(() => {
    queueRef.current = [];
    drainingRef.current = false;

    const audio = audioRef.current;
    if (audio) {
      try {
        audio.pause();
        audio.src = '';
      } catch {
        // ignore
      }
      audioRef.current = null;
    }

    if (utteranceRef.current) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
      utteranceRef.current = null;
    }

    setSpeaking(false);
  }, [setSpeaking]);

  const drainQueue = useCallback(async () => {
    if (drainingRef.current) return;
    drainingRef.current = true;

    try {
      // Process sequentially; no overlap
      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (speakingRef.current) break;
        const queue = queueRef.current;
        if (queue.length === 0) break;

        queue.sort((a, b) => b.priority - a.priority || a.id - b.id);
        const next = queue.shift();
        if (!next) break;

        setSpeaking(true);

        try {
          const { apiKey: k, voiceId: vId, canUseElevenLabs: use11 } = configRef.current;
          if (use11) {
            const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${vId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'xi-api-key': k,
              },
              body: JSON.stringify({
                text: next.text,
                model_id: 'eleven_multilingual_v2',
              }),
            });

            if (!res.ok) throw new Error('ElevenLabs failed');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audioRef.current = audio;
            if (typeof next.volume === 'number') audio.volume = Math.max(0, Math.min(1, next.volume));

            await new Promise((resolve) => {
              audio.onended = resolve;
              audio.onerror = resolve;
              audio.play().catch(resolve);
            });

            try {
              URL.revokeObjectURL(url);
            } catch {
              // ignore
            }
          } else {
            const utter = new SpeechSynthesisUtterance(next.text);
            utteranceRef.current = utter;
            if (typeof next.volume === 'number') utter.volume = Math.max(0, Math.min(1, next.volume));

            if (next.voiceHint) {
              try {
                const voices = window.speechSynthesis.getVoices?.() || [];
                const hint = String(next.voiceHint).toLowerCase();
                const match =
                  voices.find((v) => v.name?.toLowerCase?.().includes(hint)) ||
                  voices.find((v) => v.lang?.toLowerCase?.().startsWith('fr'));
                if (match) utter.voice = match;
              } catch {
                // ignore
              }
            }

            await new Promise((resolve) => {
              utter.onend = resolve;
              utter.onerror = resolve;
              try {
                window.speechSynthesis.speak(utter);
              } catch {
                resolve();
              }
            });
          }
        } finally {
          setSpeaking(false);
        }
      }
    } finally {
      drainingRef.current = false;
      // If new items arrived during drain, schedule another pass
      if (queueRef.current.length > 0 && !speakingRef.current) {
        queueMicrotask(() => {
          drainQueue();
        });
      }
    }
  }, [setSpeaking]);

  const speak = useCallback(
    (text, priority, options) => {
      const cleaned = typeof text === 'string' ? text.trim() : '';
      if (!cleaned) return;

      queueRef.current.push({
        id: Date.now() + Math.random(),
        text: cleaned,
        priority: normalizePriority(priority),
        voiceHint: options?.voiceHint || null,
        volume: typeof options?.volume === 'number' ? options.volume : undefined,
      });

      drainQueue();
    },
    [drainQueue],
  );

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    speak,
    stop,
    isSpeaking,
    canUseElevenLabs,
  };
}

