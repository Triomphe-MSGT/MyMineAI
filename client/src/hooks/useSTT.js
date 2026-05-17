import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { socket } from '../socket.js';

export function useSTT({ roomId, participant, enabled = true }) {
  const SpeechRecognitionCtor = useMemo(
    () => window.SpeechRecognition || window.webkitSpeechRecognition,
    [],
  );

  const recognitionRef = useRef(null);
  const shouldRestartRef = useRef(false);

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  const startListening = useCallback(() => {
    if (!enabled) return;
    if (!SpeechRecognitionCtor) return;
    shouldRestartRef.current = true;

    if (!recognitionRef.current) {
      const rec = new SpeechRecognitionCtor();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'fr-FR';

      rec.onresult = (event) => {
        const lastIdx = event.results.length - 1;
        if (lastIdx < 0) return;

        const result = event.results[lastIdx];
        const text = result?.[0]?.transcript?.trim() || '';
        const isFinal = Boolean(result?.isFinal);

        setTranscript(text);

        if (!roomId || !participant || !text) return;
        socket.emit('transcription-chunk', {
          roomId,
          chunk: {
            speakerId: participant.id,
            speakerName: participant.name,
            speakerProfile: participant.profile,
            text,
            timestamp: Date.now(),
            isFinal,
          },
        });
      };

      rec.onspeechstart = () => {
        socket.emit('update-state', { isSpeaking: true });
      };

      rec.onspeechend = () => {
        socket.emit('update-state', { isSpeaking: false });
      };

      rec.onend = () => {
        if (!shouldRestartRef.current) return;
        try {
          rec.start();
        } catch {
          // ignore (start can throw if called too quickly)
        }
      };

      recognitionRef.current = rec;
    }

    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      // ignore
    }
  }, [SpeechRecognitionCtor, enabled, participant, roomId]);

  const stopListening = useCallback(() => {
    shouldRestartRef.current = false;
    setIsListening(false);
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    return () => {
      shouldRestartRef.current = false;
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    };
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported: Boolean(SpeechRecognitionCtor),
  };
}

