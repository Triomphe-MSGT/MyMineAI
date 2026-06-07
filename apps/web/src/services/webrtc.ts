const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export function getPeerConfig(): RTCConfiguration {
  return { iceServers: ICE_SERVERS };
}

export async function getUserMedia(
  video = true,
  audio = true
): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    video: video ? { width: 1280, height: 720, facingMode: 'user' } : false,
    audio: audio ? { echoCancellation: true, noiseSuppression: true } : false,
  });
}

export async function getDisplayMedia(): Promise<MediaStream> {
  return navigator.mediaDevices.getDisplayMedia({
    video: { cursor: 'always' } as MediaTrackConstraints,
    audio: true,
  });
}

export interface ParticipantMedia {
  camera: MediaStream | null;
  screen: MediaStream | null;
}

export function buildPlaybackStreams(
  camera: MediaStream | null,
  screen: MediaStream | null,
  isScreenSharing: boolean
): { main: MediaStream | null; pip: MediaStream | null } {
  if (!camera && !screen) return { main: null, pip: null };

  if (isScreenSharing && screen) {
    const tracks = [
      ...screen.getVideoTracks(),
      ...screen.getAudioTracks(),
      ...(camera?.getAudioTracks() ?? []),
    ];
    const main = new MediaStream(tracks);
    const pip =
      camera && camera.getVideoTracks().length > 0
        ? new MediaStream(camera.getVideoTracks())
        : null;
    return { main, pip };
  }

  return { main: camera, pip: null };
}

export function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}
