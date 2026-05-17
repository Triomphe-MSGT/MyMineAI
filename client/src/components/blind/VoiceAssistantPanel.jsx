import { useEffect, useMemo, useRef } from 'react';
import { socket } from '../../socket.js';

export function VoiceAssistantPanel({ speak, addEvent, messages = [], participants = [], updateMyState, toggleMic, transcriptionLines = [] }) {
  const lastSpeakerRef = useRef(null);

  const participantsBySocketId = useMemo(() => {
    const m = new Map();
    for (const p of participants) m.set(p.socketId, p);
    return m;
  }, [participants]);

  useEffect(() => {
    const announce = (text, priority = 'system') => {
      addEvent?.(text);
      speak?.(text, priority);
    };

    const onJoined = ({ socketId, name }) => {
      announce(`${name} a rejoint la réunion.`, 'system');
      lastSpeakerRef.current = socketId || null;
    };
    const onLeft = ({ socketId }) => {
      const p = participantsBySocketId.get(socketId);
      const nm = p?.name || 'Un participant';
      announce(`${nm} a quitté la réunion.`, 'system');
    };
    const onUpdated = ({ socketId, handRaised, isSpeaking }) => {
      const p = participantsBySocketId.get(socketId);
      const nm = p?.name || 'Un participant';
      if (handRaised) announce(`${nm} lève la main.`, 'system');
      if (isSpeaking) lastSpeakerRef.current = socketId;
    };
    const onTranscription = (chunk) => {
      if (!chunk?.isFinal) return;
      announce(`${chunk.speakerName} dit : ${chunk.text}`, 'transcription');
    };
    const onScreenStart = ({ sharedBy }) => {
      const nm = sharedBy?.name || 'Un participant';
      announce(`${nm} partage son écran. Description en cours...`, 'system');
    };
    const onScreenDesc = (description) => {
      announce(description?.combinedForBlind || description?.text || '', 'description');
    };
    const onChat = (message) => {
      const nm = message?.senderName || 'Un participant';
      addEvent?.(`Message de ${nm} : ${message?.text || ''}`);
      speak?.(`Message de ${nm} : ${message?.text || ''}`, 'system', { voiceHint: message?.voiceHint });
    };

    socket.on('participant-joined', onJoined);
    socket.on('participant-left', onLeft);
    socket.on('participant-updated', onUpdated);
    socket.on('transcription-chunk', onTranscription);
    socket.on('screen-share-start', onScreenStart);
    socket.on('screen-share-description', onScreenDesc);
    socket.on('chat-message', onChat);

    return () => {
      socket.off('participant-joined', onJoined);
      socket.off('participant-left', onLeft);
      socket.off('participant-updated', onUpdated);
      socket.off('transcription-chunk', onTranscription);
      socket.off('screen-share-start', onScreenStart);
      socket.off('screen-share-description', onScreenDesc);
      socket.off('chat-message', onChat);
    };
  }, [addEvent, participantsBySocketId, speak]);

  // Voice commands: simple continuous recognizer
  useEffect(() => {
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return undefined;

    const rec = new SpeechRecognitionCtor();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = 'fr-FR';

    const onResult = async (event) => {
      const lastIdx = event.results.length - 1;
      const text = event.results?.[lastIdx]?.[0]?.transcript?.trim()?.toLowerCase?.() || '';
      if (!text) return;

      const say = (t) => {
        addEvent?.(t);
        speak?.(t, 'system');
      };

      // Feedback immédiat : l'utilisateur a "tapé" + parlé, on confirme qu'on écoute/traite.
      addEvent?.(`Commande : ${text}`);

      if (text.includes('lever la main')) updateMyState?.({ handRaised: true });
      else if (text.includes('baisser la main')) updateMyState?.({ handRaised: false });
      else if (text.includes('couper mon micro')) toggleMic?.();
      else if (text.includes('activer mon micro')) toggleMic?.();
      else if (text.includes('qui parle')) {
        const sid = lastSpeakerRef.current;
        const nm = sid ? participantsBySocketId.get(sid)?.name : null;
        say(nm ? `${nm} parle.` : 'Je ne sais pas qui parle.');
      } else if (text.includes('résumer la réunion')) {
        try {
          const res = await fetch('/api/meeting-summary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcription: transcriptionLines }),
          });
          const data = await res.json();
          say(data?.summary || 'Résumé non disponible.');
        } catch {
          say('Résumé non disponible.');
        }
      } else if (text.includes('lire les messages')) {
        const last = messages.slice(-5);
        if (last.length === 0) say('Aucun message.');
        else last.forEach((m) => say(`Message de ${m.senderName} : ${m.text}`));
      } else {
        say("J'ai bien reçu. Dis par exemple : « qui parle », « résumer la réunion » ou « lire les messages ».");
      }
    };

    rec.onresult = onResult;
    rec.onend = () => {
      try {
        rec.start();
      } catch {
        // ignore
      }
    };

    try {
      rec.start();
    } catch {
      // ignore
    }

    return () => {
      try {
        rec.stop();
      } catch {
        // ignore
      }
    };
  }, [addEvent, messages, participantsBySocketId, speak, toggleMic, transcriptionLines, updateMyState]);

  return (
    <div className="rounded-2xl border border-[#DDE5EF] bg-[#FFFFFF] p-4">
      <div className="text-sm font-semibold text-[#1F2D4A]" style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}>
        Assistant vocal
      </div>
      <div className="mt-2 text-sm text-[#607089]" style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}>
        Annonces temps réel + commandes vocales.
      </div>
    </div>
  );
}

