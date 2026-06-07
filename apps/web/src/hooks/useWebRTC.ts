import { useCallback, useEffect, useRef } from 'react';
import { getPeerConfig, type ParticipantMedia } from '@/services/webrtc';
import { useSocket } from './useSocket';

interface PeerSenders {
  cameraVideo: RTCRtpSender | null;
  cameraAudio: RTCRtpSender | null;
  screenVideo: RTCRtpSender | null;
  screenAudio: RTCRtpSender | null;
}

interface RemoteMediaState {
  camera: MediaStream;
  screen: MediaStream;
}

interface UseWebRTCOptions {
  cameraStream: MediaStream | null;
  screenStream: MediaStream | null;
  roomSlug: string;
  token: string;
  localSocketId: string;
  onRemoteStreams: (socketId: string, media: ParticipantMedia) => void;
  onRemoteStreamRemoved: (socketId: string) => void;
}

//
// FUTURE EXTENSION POINT:
// MyMine s'attachera ici pour intercepter les streams audio
// sans perturber le WebRTC natif.

export function useWebRTC({
  cameraStream,
  screenStream,
  roomSlug,
  token,
  localSocketId,
  onRemoteStreams,
  onRemoteStreamRemoved,
}: UseWebRTCOptions) {
  const { on, emit } = useSocket();
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const sendersRef = useRef<Map<string, PeerSenders>>(new Map());
  const remoteMediaRef = useRef<Map<string, RemoteMediaState>>(new Map());
  const pendingIceRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const cameraStreamRef = useRef(cameraStream);
  const screenStreamRef = useRef(screenStream);

  useEffect(() => {
    cameraStreamRef.current = cameraStream;
  }, [cameraStream]);

  useEffect(() => {
    screenStreamRef.current = screenStream;
  }, [screenStream]);

  const notifyRemote = useCallback(
    (socketId: string) => {
      const state = remoteMediaRef.get(socketId);
      if (!state) return;
      onRemoteStreams(socketId, {
        camera: state.camera.getTracks().length ? state.camera : null,
        screen: state.screen.getTracks().length ? state.screen : null,
      });
    },
    [onRemoteStreams]
  );

  const removePeer = useCallback(
    (socketId: string) => {
      const pc = peersRef.current.get(socketId);
      if (pc) {
        pc.close();
        peersRef.current.delete(socketId);
      }
      sendersRef.current.delete(socketId);
      remoteMediaRef.current.delete(socketId);
      pendingIceRef.current.delete(socketId);
      onRemoteStreamRemoved(socketId);
    },
    [onRemoteStreamRemoved]
  );

  const flushPendingIce = useCallback(async (socketId: string, pc: RTCPeerConnection) => {
    const pending = pendingIceRef.current.get(socketId) ?? [];
    pendingIceRef.current.delete(socketId);
    for (const candidate of pending) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('[WebRTC] ICE candidate error:', err);
      }
    }
  }, []);

  const renegotiate = useCallback(
    async (pc: RTCPeerConnection, targetSocketId: string) => {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        emit('webrtc:offer', { to: targetSocketId, offer });
      } catch (err) {
        console.error('[WebRTC] Renegotiation error:', err);
      }
    },
    [emit]
  );

  const applyMediaToPeer = useCallback(
    async (targetSocketId: string, renegotiateIfNeeded: boolean) => {
      const pc = peersRef.current.get(targetSocketId);
      if (!pc) return;

      const camera = cameraStreamRef.current;
      const screen = screenStreamRef.current;
      const senders = sendersRef.current.get(targetSocketId) ?? {
        cameraVideo: null,
        cameraAudio: null,
        screenVideo: null,
        screenAudio: null,
      };

      let needsRenegotiation = false;

      const camVideo = camera?.getVideoTracks()[0] ?? null;
      if (senders.cameraVideo) {
        await senders.cameraVideo.replaceTrack(camVideo);
      } else if (camVideo && camera) {
        senders.cameraVideo = pc.addTrack(camVideo, camera);
      }

      const camAudio = camera?.getAudioTracks()[0] ?? null;
      if (senders.cameraAudio) {
        await senders.cameraAudio.replaceTrack(camAudio);
      } else if (camAudio && camera) {
        senders.cameraAudio = pc.addTrack(camAudio, camera);
      }

      const scrVideo = screen?.getVideoTracks()[0] ?? null;
      if (scrVideo && screen) {
        if (senders.screenVideo) {
          await senders.screenVideo.replaceTrack(scrVideo);
        } else {
          senders.screenVideo = pc.addTrack(scrVideo, screen);
          needsRenegotiation = true;
        }
      } else if (senders.screenVideo) {
        pc.removeTrack(senders.screenVideo);
        senders.screenVideo = null;
        needsRenegotiation = true;
      }

      const scrAudio = screen?.getAudioTracks()[0] ?? null;
      if (scrAudio && screen) {
        if (senders.screenAudio) {
          await senders.screenAudio.replaceTrack(scrAudio);
        } else {
          senders.screenAudio = pc.addTrack(scrAudio, screen);
          needsRenegotiation = true;
        }
      } else if (senders.screenAudio) {
        pc.removeTrack(senders.screenAudio);
        senders.screenAudio = null;
        needsRenegotiation = true;
      }

      sendersRef.current.set(targetSocketId, senders);

      if (needsRenegotiation && renegotiateIfNeeded) {
        await renegotiate(pc, targetSocketId);
      }
    },
    [renegotiate]
  );

  const setupPeerConnection = useCallback(
    (targetSocketId: string): RTCPeerConnection => {
      const existing = peersRef.current.get(targetSocketId);
      if (existing) return existing;

      const pc = new RTCPeerConnection(getPeerConfig());

      pc.ontrack = (event) => {
        const track = event.track;
        let state = remoteMediaRef.get(targetSocketId);
        if (!state) {
          state = { camera: new MediaStream(), screen: new MediaStream() };
          remoteMediaRef.set(targetSocketId, state);
        }

        if (track.kind === 'video') {
          if (state.camera.getVideoTracks().length === 0) {
            state.camera.addTrack(track);
          } else {
            state.screen.getVideoTracks().forEach((t) => state!.screen.removeTrack(t));
            state.screen.addTrack(track);
          }
          track.onended = () => {
            if (state!.screen.getVideoTracks().includes(track)) {
              state!.screen.removeTrack(track);
            } else {
              state!.camera.removeTrack(track);
            }
            notifyRemote(targetSocketId);
          };
        } else if (track.kind === 'audio') {
          if (state.camera.getAudioTracks().length === 0) {
            state.camera.addTrack(track);
          } else {
            state.screen.getAudioTracks().forEach((t) => state!.screen.removeTrack(t));
            state.screen.addTrack(track);
          }
        }

        notifyRemote(targetSocketId);
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          emit('webrtc:ice-candidate', {
            to: targetSocketId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          removePeer(targetSocketId);
        }
      };

      peersRef.current.set(targetSocketId, pc);
      sendersRef.current.set(targetSocketId, {
        cameraVideo: null,
        cameraAudio: null,
        screenVideo: null,
        screenAudio: null,
      });

      return pc;
    },
    [emit, notifyRemote, removePeer]
  );

  const createOffer = useCallback(
    async (targetSocketId: string) => {
      setupPeerConnection(targetSocketId);
      await applyMediaToPeer(targetSocketId, false);
      const pc = peersRef.current.get(targetSocketId)!;
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        emit('webrtc:offer', { to: targetSocketId, offer });
      } catch (err) {
        console.error('[WebRTC] Offer error:', err);
        removePeer(targetSocketId);
      }
    },
    [setupPeerConnection, applyMediaToPeer, emit, removePeer]
  );

  const handleOffer = useCallback(
    async (from: string, offer: RTCSessionDescriptionInit) => {
      setupPeerConnection(from);
      await applyMediaToPeer(from, false);
      const pc = peersRef.current.get(from)!;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        await flushPendingIce(from, pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        emit('webrtc:answer', { to: from, answer });
      } catch (err) {
        console.error('[WebRTC] Answer error:', err);
        removePeer(from);
      }
    },
    [setupPeerConnection, applyMediaToPeer, emit, removePeer, flushPendingIce]
  );

  const handleAnswer = useCallback(
    async (from: string, answer: RTCSessionDescriptionInit) => {
      const pc = peersRef.current.get(from);
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        await flushPendingIce(from, pc);
      } catch (err) {
        console.error('[WebRTC] Remote answer error:', err);
        removePeer(from);
      }
    },
    [removePeer, flushPendingIce]
  );

  const handleIceCandidate = useCallback(async (from: string, candidate: RTCIceCandidateInit) => {
    const pc = peersRef.current.get(from);
    if (!pc || !pc.remoteDescription) {
      const queue = pendingIceRef.current.get(from) ?? [];
      queue.push(candidate);
      pendingIceRef.current.set(from, queue);
      return;
    }
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error('[WebRTC] ICE error:', err);
    }
  }, []);

  const connectToPeer = useCallback(
    (socketId: string) => {
      if (socketId === localSocketId || peersRef.current.has(socketId)) return;
      const isInitiator = localSocketId < socketId;
      if (isInitiator) {
        createOffer(socketId);
      }
    },
    [localSocketId, createOffer]
  );

  useEffect(() => {
    if (!cameraStream || !roomSlug || !token) return;

    const cleanups: (() => void)[] = [];

    cleanups.push(on('room:user-joined', ({ participant }) => connectToPeer(participant.socketId)));
    cleanups.push(on('room:user-left', ({ socketId }) => removePeer(socketId)));
    cleanups.push(on('webrtc:offer', ({ from, offer }) => handleOffer(from, offer)));
    cleanups.push(on('webrtc:answer', ({ from, answer }) => handleAnswer(from, answer)));
    cleanups.push(
      on('webrtc:ice-candidate', ({ from, candidate }) => handleIceCandidate(from, candidate))
    );

    return () => cleanups.forEach((fn) => fn());
  }, [
    cameraStream,
    roomSlug,
    token,
    on,
    connectToPeer,
    removePeer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
  ]);

  useEffect(() => {
    if (!cameraStream) return;
    peersRef.current.forEach((_, socketId) => {
      applyMediaToPeer(socketId, true);
    });
  }, [cameraStream, screenStream, applyMediaToPeer]);

  const connectToExistingPeers = useCallback(
    (socketIds: string[]) => {
      socketIds.forEach((id) => connectToPeer(id));
    },
    [connectToPeer]
  );

  const cleanup = useCallback(() => {
    peersRef.current.forEach((pc) => pc.close());
    peersRef.current.clear();
    sendersRef.current.clear();
    remoteMediaRef.current.clear();
    pendingIceRef.current.clear();
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  return {
    connectToExistingPeers,
    removePeer,
    cleanup,
  };
}
