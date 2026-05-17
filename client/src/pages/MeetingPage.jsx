import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { socket } from '../socket.js';
import { useRoom } from '../hooks/useRoom.js';
import { useChat } from '../hooks/useChat.js';
import { useSTT } from '../hooks/useSTT.js';
import { useTTS } from '../hooks/useTTS.js';
import { useWebRTC } from '../hooks/useWebRTC.js';
import { useScreenShare } from '../hooks/useScreenShare.js';
import { useMymineEvents } from '../hooks/useMymineEvents.js';
import { StandardLayout } from '../components/standard/StandardLayout.jsx';
import { BlindLayout } from '../components/blind/BlindLayout.jsx';
import { DeafLayout } from '../components/deaf/DeafLayout.jsx';

function makeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function MeetingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};

  const name = typeof state.name === 'string' ? state.name : '';
  const profile = typeof state.profile === 'string' ? state.profile : 'standard';
  const roomId = typeof state.roomId === 'string' ? state.roomId : '';

  const participant = useMemo(
    () => ({
      id: makeId(),
      name,
      profile,
      isMuted: false,
      videoEnabled: true,
    }),
    [name, profile],
  );

  const { participants, joinRoom, updateMyState } = useRoom();
  const { localStream, remoteStreams, toggleMic, toggleCamera } = useWebRTC();
  const { messages, setRoomId: setChatRoomId, sendMessage } = useChat();
  const { speak } = useTTS();
  const sttEnabled = profile !== 'deaf';
  const { isSupported: sttSupported, startListening, stopListening } = useSTT({
    roomId,
    participant,
    enabled: sttEnabled,
  });
  const { screenStream, isSharing, isLocalPresenter, startShare, stopShare, latestDescription, presenterNote, presenterProfile, submitPresenterNote } = useScreenShare({
    roomId,
    participant,
    participants,
  });
  const { events: mymineEvents, latest: latestMymineEvent, emit: emitMymineEvent } = useMymineEvents({
    roomId,
    participant,
  });

  const [connected, setConnected] = useState(false);
  const [transcriptionLines, setTranscriptionLines] = useState([]);
  const [mySocketId, setMySocketId] = useState(null);

  useEffect(() => {
    if (!name || !roomId) return undefined;

    const onConnect = () => {
      setConnected(true);
      setMySocketId(socket.id || null);
      joinRoom({ roomId, participant });
      setChatRoomId(roomId);
      if (sttEnabled && sttSupported) startListening();
    };

    socket.on('connect', onConnect);
    socket.connect();

    return () => {
      try {
        stopListening();
      } catch {
        // ignore
      }
      socket.off('connect', onConnect);
      if (socket.connected) socket.disconnect();
      setConnected(false);
      setMySocketId(null);
    };
  }, [joinRoom, name, participant, roomId, setChatRoomId, startListening, stopListening, sttEnabled, sttSupported]);

  useEffect(() => {
    const onChunk = (chunk) => {
      if (!chunk?.isFinal) return;
      setTranscriptionLines((prev) => [
        ...prev,
        {
          id: makeId(),
          speakerId: chunk.speakerId,
          speakerName: chunk.speakerName,
          speakerProfile: chunk.speakerProfile,
          text: chunk.text,
          timestamp: chunk.timestamp,
        },
      ]);
    };
    socket.on('transcription-chunk', onChunk);
    return () => socket.off('transcription-chunk', onChunk);
  }, []);

  // Chaque parole locale (micro) alimente le pipeline MyMine → LSF / TTS / résumé
  useEffect(() => {
    if (!sttEnabled) return undefined;
    const onChunk = (chunk) => {
      if (!chunk?.isFinal) return;
      if (chunk.speakerId !== participant.id) return;
      emitMymineEvent('audio', { text: chunk.text }, {
        id: chunk.speakerId,
        name: chunk.speakerName,
        profile: chunk.speakerProfile,
      });
    };
    socket.on('transcription-chunk', onChunk);
    return () => socket.off('transcription-chunk', onChunk);
  }, [emitMymineEvent, participant.id, sttEnabled]);

  // Lecture vocale (profil aveugle) à chaque évènement MyMine entrant
  useEffect(() => {
    if (!latestMymineEvent) return;
    if (profile === 'blind' && latestMymineEvent.profile === 'blind') {
      if (latestMymineEvent.tts && latestMymineEvent.text) {
        const prio =
          latestMymineEvent.priority === 'urgent' ? 'system' :
          latestMymineEvent.priority === 'notif' ? 'low' : 'transcription';
        speak?.(latestMymineEvent.text, prio);
      }
    }
  }, [latestMymineEvent, profile, speak]);

  const sendChatMessage = useCallback(
    (text, meta = {}) => {
      const cleaned = typeof text === 'string' ? text.trim() : '';
      if (!cleaned) return;
      sendMessage({
        id: makeId(),
        senderId: participant.id,
        senderName: participant.name,
        senderProfile: participant.profile,
        text: cleaned,
        ...meta,
        timestamp: Date.now(),
      });
      emitMymineEvent('chat', { text: cleaned });
    },
    [emitMymineEvent, participant.id, participant.name, participant.profile, sendMessage],
  );

  const participantsWithSelf = useMemo(() => {
    const list = Array.isArray(participants) ? participants : [];
    const sid = mySocketId || socket.id || null;
    if (!sid) return list;
    const already = list.some((p) => p?.socketId === sid);
    if (already) return list;
    return [{ socketId: sid, ...participant }, ...list];
  }, [mySocketId, participant, participants]);

  if (!name || !roomId) return null;

  if (profile === 'blind') {
    return (
      <BlindLayout
        speak={speak}
        messages={messages}
        participants={participantsWithSelf}
        updateMyState={updateMyState}
        toggleMic={toggleMic}
        transcriptionLines={transcriptionLines}
        mymineEvents={mymineEvents}
        latestMymineEvent={latestMymineEvent}
        emitMymineEvent={emitMymineEvent}
      />
    );
  }

  if (profile === 'deaf') {
    return (
      <DeafLayout
        roomId={roomId}
        participant={participant}
        participants={participantsWithSelf}
        localStream={localStream}
        remoteStreams={remoteStreams}
        toggleMic={toggleMic}
        toggleCamera={toggleCamera}
        updateMyState={updateMyState}
        messages={messages}
        sendChatMessage={sendChatMessage}
        isSharing={isSharing}
        isLocalPresenter={isLocalPresenter}
        startShare={startShare}
        stopShare={stopShare}
        latestDescription={latestDescription}
        presenterNote={presenterNote}
        presenterProfile={presenterProfile}
        submitPresenterNote={submitPresenterNote}
        mymineEvents={mymineEvents}
        latestMymineEvent={latestMymineEvent}
        emitMymineEvent={emitMymineEvent}
        localSocketId={mySocketId || socket.id || undefined}
      />
    );
  }

  return (
    <StandardLayout
      roomId={roomId}
      participant={participant}
      participants={participantsWithSelf}
      localStream={localStream}
      remoteStreams={remoteStreams}
      toggleMic={toggleMic}
      toggleCamera={toggleCamera}
      updateMyState={updateMyState}
      messages={messages}
      sendMessage={sendChatMessage}
      screenStream={screenStream}
      isScreenSharing={isSharing}
      isLocalPresenter={isLocalPresenter}
      latestDescription={latestDescription}
      presenterNote={presenterNote}
      presenterProfile={presenterProfile}
      startShare={startShare}
      stopShare={stopShare}
      mymineEvents={mymineEvents}
      latestMymineEvent={latestMymineEvent}
      emitMymineEvent={emitMymineEvent}
    />
  );
}
