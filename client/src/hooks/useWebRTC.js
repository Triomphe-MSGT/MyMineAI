import { useCallback, useEffect, useRef, useState } from 'react';
import SimplePeer from 'simple-peer';
import { socket } from '../socket.js';

export function useWebRTC() {
  const peersRef = useRef(new Map()); // socketId -> SimplePeer
  const remoteStreamsRef = useRef(new Map()); // socketId -> MediaStream
  const localStreamRef = useRef(null);

  const [localStream, setLocalStream] = useState(null);
  const [, forceRerender] = useState(0);

  const syncState = useCallback(() => {
    // Force rerender so Maps are reflected in React usage
    forceRerender((x) => x + 1);
  }, []);

  const addRemoteStream = useCallback((socketId, stream) => {
    remoteStreamsRef.current.set(socketId, stream);
    syncState();
  }, [syncState]);

  const removePeer = useCallback((socketId) => {
    const peer = peersRef.current.get(socketId);
    if (peer) {
      try {
        peer.destroy();
      } catch {
        // ignore
      }
    }
    peersRef.current.delete(socketId);
    remoteStreamsRef.current.delete(socketId);
    syncState();
  }, [syncState]);

  const ensurePeer = useCallback((socketId, { initiator }) => {
    if (peersRef.current.has(socketId)) return peersRef.current.get(socketId);

    const peer = new SimplePeer({
      initiator,
      trickle: true,
      stream: localStreamRef.current || undefined,
    });

    peer.on('signal', (data) => {
      // SimplePeer emits offer/answer/candidate here depending on phase
      if (data?.type === 'offer') socket.emit('webrtc-offer', { to: socketId, offer: data });
      else if (data?.type === 'answer') socket.emit('webrtc-answer', { to: socketId, answer: data });
      else socket.emit('webrtc-ice', { to: socketId, candidate: data });
    });

    peer.on('stream', (stream) => {
      addRemoteStream(socketId, stream);
    });

    peer.on('close', () => removePeer(socketId));
    peer.on('error', () => removePeer(socketId));

    peersRef.current.set(socketId, peer);
    syncState();
    return peer;
  }, [addRemoteStream, removePeer, syncState]);

  const toggleMic = useCallback(() => {
    const s = localStreamRef.current;
    if (!s) return;
    s.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
  }, []);

  const toggleCamera = useCallback(() => {
    const s = localStreamRef.current;
    if (!s) return;
    s.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        setLocalStream(stream);

        // If peers already exist, add tracks by replacing stream via addTrack
        for (const peer of peersRef.current.values()) {
          for (const track of stream.getTracks()) {
            try {
              peer.addTrack(track, stream);
            } catch {
              // ignore
            }
          }
        }
      } catch {
        // Permissions denied or device missing: keep running with null localStream
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onParticipantJoined = ({ socketId }) => {
      // Existing participants initiate towards the newcomer
      if (!socketId || socketId === socket.id) return;
      ensurePeer(socketId, { initiator: true });
    };

    const onParticipantLeft = ({ socketId }) => {
      if (!socketId) return;
      removePeer(socketId);
    };

    const onWebrtcOffer = ({ from, offer }) => {
      if (!from || from === socket.id) return;
      const peer = ensurePeer(from, { initiator: false });
      peer.signal(offer);
    };

    const onWebrtcAnswer = ({ from, answer }) => {
      const peer = peersRef.current.get(from);
      if (!peer) return;
      peer.signal(answer);
    };

    const onWebrtcIce = ({ from, candidate }) => {
      const peer = peersRef.current.get(from);
      if (!peer) return;
      peer.signal(candidate);
    };

    socket.on('participant-joined', onParticipantJoined);
    socket.on('participant-left', onParticipantLeft);
    socket.on('webrtc-offer', onWebrtcOffer);
    socket.on('webrtc-answer', onWebrtcAnswer);
    socket.on('webrtc-ice', onWebrtcIce);

    return () => {
      socket.off('participant-joined', onParticipantJoined);
      socket.off('participant-left', onParticipantLeft);
      socket.off('webrtc-offer', onWebrtcOffer);
      socket.off('webrtc-answer', onWebrtcAnswer);
      socket.off('webrtc-ice', onWebrtcIce);
    };
  }, [ensurePeer, removePeer]);

  useEffect(() => {
    return () => {
      for (const peer of peersRef.current.values()) {
        try {
          peer.destroy();
        } catch {
          // ignore
        }
      }
      peersRef.current.clear();

      remoteStreamsRef.current.clear();

      const s = localStreamRef.current;
      if (s) s.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    };
  }, []);

  return {
    localStream,
    remoteStreams: remoteStreamsRef.current,
    toggleMic,
    toggleCamera,
    peers: peersRef.current,
  };
}

