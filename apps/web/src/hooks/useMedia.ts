import { useCallback, useEffect, useRef, useState } from 'react';
import { getUserMedia, getDisplayMedia, stopStream } from '@/services/webrtc';

export function useMedia() {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const initMedia = useCallback(async () => {
    try {
      const stream = await getUserMedia(true, true);
      streamRef.current = stream;
      setLocalStream(stream);
      setError(null);
      return stream;
    } catch (err) {
      setError('Impossible d\'accéder à la caméra/micro');
      console.error(err);
      return null;
    }
  }, []);

  const toggleMute = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return false;
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
      return !audioTrack.enabled;
    }
    return isMuted;
  }, [isMuted]);

  const toggleVideo = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return true;
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOn(videoTrack.enabled);
      return videoTrack.enabled;
    }
    return isVideoOn;
  }, [isVideoOn]);

  const stopScreenShare = useCallback(() => {
    setScreenStream((current) => {
      if (current) stopStream(current);
      return null;
    });
    setIsScreenSharing(false);
  }, []);

  const startScreenShare = useCallback(async () => {
    try {
      const display = await getDisplayMedia();
      const videoTrack = display.getVideoTracks()[0];
      if (!videoTrack) {
        stopStream(display);
        return false;
      }
      videoTrack.onended = () => {
        stopScreenShare();
      };
      setScreenStream(display);
      setIsScreenSharing(true);
      return true;
    } catch {
      return false;
    }
  }, [stopScreenShare]);

  const cleanup = useCallback(() => {
    stopStream(streamRef.current);
    stopStream(screenStream);
    streamRef.current = null;
    setLocalStream(null);
    setScreenStream(null);
    setIsScreenSharing(false);
  }, [screenStream]);

  useEffect(() => () => cleanup(), [cleanup]);

  return {
    localStream,
    screenStream,
    isMuted,
    isVideoOn,
    isScreenSharing,
    error,
    initMedia,
    toggleMute,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    cleanup,
  };
}
