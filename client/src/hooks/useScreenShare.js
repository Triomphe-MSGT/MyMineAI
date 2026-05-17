import { useCallback, useEffect, useRef, useState } from 'react';
import { socket } from '../socket.js';

export function useScreenShare({ roomId, participant, participants = [] }) {
  const [screenStream, setScreenStream] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isLocalPresenter, setIsLocalPresenter] = useState(false);
  const [latestDescription, setLatestDescription] = useState('');
  const [presenterNote, setPresenterNote] = useState('');
  const [presenterProfile, setPresenterProfile] = useState('standard');

  const intervalRef = useRef(null);
  const activeStreamRef = useRef(null);
  const presenterNoteRef = useRef('');
  const presenterProfileRef = useRef('standard');

  const stopShare = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setIsSharing(false);
    setIsLocalPresenter(false);
    setLatestDescription('');
    setPresenterNote('');
    setPresenterProfile('standard');

    const s = activeStreamRef.current || screenStream;
    if (s) s.getTracks().forEach((t) => t.stop());
    setScreenStream(null);
    activeStreamRef.current = null;

    if (roomId) socket.emit('screen-share-stop', { roomId });
  }, [roomId, screenStream]);

  const captureFrameBase64 = useCallback(async (stream) => {
    const track = stream?.getVideoTracks?.()[0];
    if (!track) return null;

    const imageCaptureSupported = typeof ImageCapture !== 'undefined';
    if (imageCaptureSupported) {
      try {
        const ic = new ImageCapture(track);
        const bitmap = await ic.grabFrame();
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bitmap, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        return dataUrl.split(',')[1] || null;
      } catch {
        // fall through to video element capture
      }
    }

    const video = document.createElement('video');
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;

    await new Promise((resolve) => {
      video.onloadedmetadata = resolve;
    });

    try {
      await video.play();
    } catch {
      // ignore
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
    return dataUrl.split(',')[1] || null;
  }, []);

  const startShare = useCallback(
    async (presenterNote = '', presenterProfile = 'standard') => {
      if (!roomId || !participant) return;

      presenterNoteRef.current = presenterNote || '';
      presenterProfileRef.current = presenterProfile || 'standard';
      setPresenterNote(presenterNoteRef.current);
      setPresenterProfile(presenterProfileRef.current);

      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      setScreenStream(stream);
      activeStreamRef.current = stream;
      setIsSharing(true);
      setIsLocalPresenter(true);

      socket.emit('screen-share-start', {
        roomId,
        sharedBy: { id: participant.id, name: participant.name, profile: participant.profile },
      });

      const shouldDescribe =
        participant?.profile === 'blind' || participants.some((p) => p?.profile === 'blind');
      if (!shouldDescribe) return;

      const tick = async () => {
        try {
          const imageBase64 = await captureFrameBase64(stream);
          if (!imageBase64) return;

          const res = await fetch('/api/describe-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64,
              presenterText: presenterNoteRef.current,
              presenterProfile: presenterProfileRef.current,
            }),
          });

          const data = await res.json();
          const text = data?.description || '';
          setLatestDescription(text);

          const presenterNoteNow = presenterNoteRef.current;
          const combinedForBlind = presenterNoteNow
            ? `${text} ${presenterNoteNow}`.trim()
            : text;

          socket.emit('screen-share-description', {
            roomId,
            description: {
              text,
              presenterNote: presenterNoteNow,
              combinedForBlind,
            },
          });
        } catch {
          // ignore (network/permissions)
        }
      };

      await tick();
      intervalRef.current = setInterval(tick, 3000);

      const onEnded = () => stopShare();
      stream.getVideoTracks()[0]?.addEventListener?.('ended', onEnded, { once: true });
    },
    [captureFrameBase64, participant, participants, roomId, stopShare],
  );

  const submitPresenterNote = useCallback(
    async (noteText = '') => {
      if (!roomId || !participant) return;
      presenterNoteRef.current = noteText || '';
      setPresenterNote(presenterNoteRef.current);

      // Si on ne décrit pas (pas de participant aveugle), on ne fait rien.
      const shouldDescribe =
        presenterProfileRef.current === 'blind' ||
        participant?.profile === 'blind' ||
        participants.some((p) => p?.profile === 'blind');

      if (!shouldDescribe) return;

      const stream = activeStreamRef.current;
      if (!stream) return;

      try {
        const imageBase64 = await captureFrameBase64(stream);
        if (!imageBase64) return;

        const res = await fetch('/api/describe-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64,
            presenterText: presenterNoteRef.current,
            presenterProfile: presenterProfileRef.current,
          }),
        });

        const data = await res.json();
        const text = data?.description || '';
        setLatestDescription(text);

        const presenterNoteNow = presenterNoteRef.current;
        const combinedForBlind = presenterNoteNow ? `${text} ${presenterNoteNow}`.trim() : text;

        socket.emit('screen-share-description', {
          roomId,
          description: {
            text,
            presenterNote: presenterNoteNow,
            combinedForBlind,
          },
        });
      } catch {
        // ignore
      }
    },
    [captureFrameBase64, participant, participants, roomId],
  );

  useEffect(() => {
    const onScreenShareStart = ({ sharedBy }) => {
      setIsSharing(true);
      setLatestDescription('');
      setPresenterNote('');
      setPresenterProfile(sharedBy?.profile || 'standard');
      setIsLocalPresenter(Boolean(sharedBy?.id && participant?.id && sharedBy.id === participant.id));
    };

    const onScreenShareStop = () => {
      setIsSharing(false);
      setLatestDescription('');
      setPresenterNote('');
      setPresenterProfile('standard');
      setIsLocalPresenter(false);
    };

    const onScreenShareDescription = ({ description }) => {
      const text = description?.text || '';
      setLatestDescription(text);
      setPresenterNote(description?.presenterNote || '');
    };

    socket.on('screen-share-start', onScreenShareStart);
    socket.on('screen-share-stop', onScreenShareStop);
    socket.on('screen-share-description', onScreenShareDescription);

    return () => {
      socket.off('screen-share-start', onScreenShareStart);
      socket.off('screen-share-stop', onScreenShareStop);
      socket.off('screen-share-description', onScreenShareDescription);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, []);

  return {
    screenStream,
    isSharing,
    isLocalPresenter,
    startShare,
    stopShare,
    latestDescription,
    presenterNote,
    presenterProfile,
    submitPresenterNote,
  };
}

