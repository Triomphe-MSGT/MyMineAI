import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { ScreenShareOverlay } from './ScreenShareOverlay.jsx';
import { Toolbar } from './Toolbar.jsx';
import { VideoGrid } from './VideoGrid.jsx';
import { ChatPanel } from '../shared/ChatPanel.jsx';
import { ParticipantList } from '../shared/ParticipantList.jsx';
import { socket } from '../../socket.js';

export function StandardLayout({
  roomId,
  participant,
  participants,
  localStream,
  remoteStreams,
  toggleMic,
  toggleCamera,
  updateMyState,
  messages,
  sendMessage,
  screenStream,
  isScreenSharing,
  isLocalPresenter,
  latestDescription,
  presenterNote,
  presenterProfile,
  startShare,
  stopShare,
  latestMymineEvent,
  /** Quand défini (ex. démo vidéo), remplace `socket.id` pour filtrer le présentateur local. */
  localSocketId,
  /** Passé à VideoGrid pour la vignette locale (défaut : « Vous »). */
  localTileParticipant,
  /** Passé à l’overlay partage d’écran : `contained` pour démo / iframe. */
  screenOverlayPlacement = 'fullscreen',
}) {
  const [isMuted, setIsMuted] = useState(Boolean(participant?.isMuted));
  const [videoEnabled, setVideoEnabled] = useState(Boolean(participant?.videoEnabled));
  const [handRaised, setHandRaised] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!latestMymineEvent?.summary) return undefined;
    setToast({
      id: latestMymineEvent.timestamp || Date.now(),
      text: latestMymineEvent.summary,
      priority: latestMymineEvent.priority || 'info',
    });
    const t = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(t);
  }, [latestMymineEvent]);

  const localSid = localSocketId ?? socket.id;
  const otherParticipants = useMemo(
    () => participants.filter((p) => p.socketId !== localSid),
    [participants, localSid],
  );

  const rootH = screenOverlayPlacement === 'contained' ? 'min-h-0 h-full' : 'min-h-screen';

  return (
    <div className={`relative w-full ${rootH}`} style={{ backgroundColor: '#FFFFFF', color: '#1F2D4A' }}>
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 px-6 py-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#DDE5EF] bg-[#FFFFFF] p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-extrabold" style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}>
                  Room {roomId}
                </div>
                <div className="mt-1 text-sm text-[#607089]" style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}>
                  Connecté en temps réel · WebRTC · Chat · STT
                </div>
              </div>
              <div className="text-sm text-[#607089]" style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}>
                {participant?.name}
              </div>
            </div>
          </div>

          <VideoGrid
            participants={participants}
            localStream={localStream}
            remoteStreams={remoteStreams}
            localTileParticipant={localTileParticipant}
            localSocketId={localSid}
          />

          <Toolbar
            isMuted={isMuted}
            videoEnabled={videoEnabled}
            handRaised={handRaised}
            isSharing={Boolean(isScreenSharing)}
            onToggleScreenShare={async () => {
              if (isLocalPresenter) stopShare?.();
              else await startShare?.('', participant?.profile || 'standard');
            }}
            onToggleMic={() => {
              toggleMic?.();
              const next = !isMuted;
              setIsMuted(next);
              updateMyState?.({ isMuted: next });
            }}
            onToggleCamera={() => {
              toggleCamera?.();
              const next = !videoEnabled;
              setVideoEnabled(next);
              updateMyState?.({ videoEnabled: next });
            }}
            onToggleHand={() => {
              const next = !handRaised;
              setHandRaised(next);
              updateMyState?.({ handRaised: next });
            }}
          />
        </div>

        <div className="space-y-4">
          <ParticipantList participants={participants} />
          <ChatPanel messages={messages} onSend={sendMessage} />
        </div>
      </div>

      <ScreenShareOverlay
        isActive={Boolean(isScreenSharing)}
        screenStream={screenStream}
        latestDescription={latestDescription}
        presenterNote={presenterNote}
        presenterProfile={presenterProfile}
        participants={otherParticipants}
        placement={screenOverlayPlacement}
      />

      <AnimatePresence>
        {toast ? (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="pointer-events-none fixed bottom-6 right-6 z-40 max-w-sm rounded-2xl border bg-[#FFFFFF]/95 px-4 py-3 backdrop-blur"
            style={{
              borderColor: toast.priority === 'urgent' ? '#3D8BF0' : '#DDE5EF',
              boxShadow: '0 20px 60px rgba(0,0,0,0.45), 0 0 24px rgba(61,139,240,0.10)',
            }}
          >
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0" style={{ color: '#3D8BF0' }} />
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#607089]" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
                  MyMine AI · {toast.priority}
                </div>
                <div className="mt-0.5 text-sm text-[#1F2D4A]" style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}>
                  {toast.text}
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

