import { useCallback, useEffect, useState } from 'react';
import { socket } from '../socket.js';

/**
 * useMymineEvents — branche le pipeline d'accessibilité MyMine
 * (équivalent côté client du flow Flowise mymine_flowise_flow.json).
 *
 * Reçoit des évènements pré-formattés par le serveur pour le profil
 * de l'utilisateur courant :
 *   - blind    : { profile:'blind',    text, tts, priority, ... }
 *   - deaf     : { profile:'deaf',     subtitle, lsf_gloses, needsLSF, priority, ... }
 *   - standard : { profile:'standard', summary, priority, ... }
 *
 * Et expose `emit(type, payload, speaker)` pour déclencher le pipeline depuis
 * n'importe quel composant (ex: TextToSpeechInput, raise hand, etc.).
 */
export function useMymineEvents({ roomId, participant }) {
  const [events, setEvents] = useState([]);
  const [latest, setLatest] = useState(null);

  useEffect(() => {
    if (!roomId) return undefined;
    const handler = (evt) => {
      if (!evt) return;
      setLatest(evt);
      setEvents((prev) => [...prev.slice(-49), { ...evt, _rxAt: Date.now() }]);
    };
    socket.on('mymine-event', handler);
    return () => {
      socket.off('mymine-event', handler);
    };
  }, [roomId]);

  const emit = useCallback(
    (type, payload, speakerOverride) => {
      if (!roomId || !type) return;
      const speaker = speakerOverride || (participant
        ? { id: participant.id, name: participant.name, profile: participant.profile }
        : null);
      socket.emit('mymine-event', { roomId, type, payload, speaker });
    },
    [participant, roomId],
  );

  return { events, latest, emit };
}
