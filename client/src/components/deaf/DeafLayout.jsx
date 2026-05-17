import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { socket } from '../../socket.js';
import { TextToSpeechInput } from './TextToSpeechInput.jsx';
import { TranscriptionFeed } from './TranscriptionFeed.jsx';
import { SignLanguageAvatar } from './SignLanguageAvatar.jsx';
import { GestureCaptureMirror } from './GestureCaptureMirror.jsx';
import { StickFigureSigner } from './StickFigureSigner.jsx';
import { VideoGrid } from '../standard/VideoGrid.jsx';
import { Toolbar } from '../standard/Toolbar.jsx';
import { ParticipantList } from '../shared/ParticipantList.jsx';
import { ChatPanel } from '../shared/ChatPanel.jsx';

function makeLineId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Gloses additionnelles pour animer le bonhomme bâton en démo `/demo-video`. */
const DEMO_LSF_EXTRA_GLOSES =
  'MONTRER CONFIRMER ACCUEIL MERCI QUESTION REPONSE ECRAN GRAPHIQUE VENTE MARS PIC SALUT OK ACCORD DEMANDE INFO MESSAGE';

function PresenterScreenEmbed({ stream, label }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.srcObject = stream || null;
  }, [stream]);

  if (!stream) return null;

  return (
    <div
      className="mb-3 overflow-hidden rounded-2xl border border-[#1F5FBE] bg-[#0b1420] shadow-[0_12px_40px_rgba(31,95,190,0.18)]"
      role="region"
      aria-label="Écran partagé par un participant"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
        <div className="text-[11px] font-bold uppercase tracking-wide text-white" style={{ fontFamily: "'Open Sans', sans-serif" }}>
          Écran partagé (vue Carla)
        </div>
        <span
          className="max-w-[70%] truncate rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/90"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
          title={label || undefined}
        >
          {label || 'Profil standard'}
        </span>
      </div>
      <div className="relative w-full bg-black">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="max-h-[min(52vh,560px)] w-full object-contain"
        />
      </div>
    </div>
  );
}

export function DeafLayout({
  roomId,
  participant,
  sendChatMessage,
  participants = [],
  localStream,
  remoteStreams,
  toggleMic,
  toggleCamera,
  updateMyState,
  messages = [],
  isSharing,
  isLocalPresenter,
  startShare,
  stopShare,
  latestDescription,
  presenterNote,
  presenterProfile,
  submitPresenterNote,
  latestMymineEvent,
  emitMymineEvent,
  /** Si tableau : alimente les sous-titres comme `transcription-chunk` sans Socket.io (démo vidéo). */
  syntheticTranscriptionLines,
  /** Aligné sur StandardLayout : socket du participant local pour la galerie. */
  localSocketId,
  /** Vignette vidéo locale (défaut : comportement VideoGrid). */
  localTileParticipant,
  /**
   * Mode démo triple colonne : marges réduites, pas de min-h-screen, zone LSF bornée,
   * grille empilée — pour que l’échelle automatique affiche tout l’écran comme Standard / Aveugle.
   */
  demoDenseLayout = false,
  /**
   * Démo « Agrandir » sans DemoViewportFit : pleine largeur, défilement vertical,
   * vignettes et panneaux plus lisibles (prioritaire si `demoDenseLayout` est false).
   */
  demoExpandedViewport = false,
  /**
   * Démo `/demo-video` : pas de caméra mains — grand panneau bonhomme bâton + gloses animées.
   */
  demoSimulatedSignerOnly = false,
  /** Flux vidéo du partage d’écran du présentateur (ex. Alice · standard). */
  presenterScreenStream = null,
  /** Libellé court pour l’en-tête du panneau (nom du présentateur). */
  presenterScreenLabel,
}) {
  const [lines, setLines] = useState([]);
  const [activeSpeakerId, setActiveSpeakerId] = useState(null);
  const [isMuted, setIsMuted] = useState(Boolean(participant?.isMuted));
  const [videoEnabled, setVideoEnabled] = useState(Boolean(participant?.videoEnabled));
  const [handRaised, setHandRaised] = useState(false);
  const [voiceHint, setVoiceHint] = useState('woman voice');

  /* ============================================================
   * Transcription des signes via l'API backend (mymineFlow)
   * ============================================================ */
  const [myTranscriptions, setMyTranscriptions] = useState([]); // [{ id, gloses, text, status, ts }]
  const [pendingId, setPendingId] = useState(null);

  // Quand l'utilisateur clique « Envoyer » dans le GestureCaptureMirror,
  // on envoie les gestes au backend pour transcription en phrase naturelle.
  useEffect(() => {
    const handler = (e) => {
      const history = e?.detail?.history || [];
      const tokens = history.map((h) => h.label);
      if (tokens.length === 0) return;
      const localId = `${Date.now()}-${Math.random()}`;
      setMyTranscriptions((prev) => [
        ...prev.slice(-9),
        { id: localId, gloses: tokens, text: '', status: 'pending', ts: Date.now() },
      ]);
      setPendingId(localId);
      try {
        emitMymineEvent?.('gesture', { signs: tokens, gloses: tokens.join(' '), localId });
      } catch {
        // ignore
      }
    };
    window.addEventListener('mymine:gesture-send', handler);
    return () => window.removeEventListener('mymine:gesture-send', handler);
  }, [emitMymineEvent]);

  // Quand l'API répond (mymine-event geste), on met à jour la transcription en attente.
  useEffect(() => {
    if (!latestMymineEvent || !pendingId) return;
    if (latestMymineEvent.eventType && latestMymineEvent.eventType !== 'gesture') return;
    if (latestMymineEvent.localId && latestMymineEvent.localId !== pendingId) return;
    const text = latestMymineEvent.subtitle || latestMymineEvent.standard_summary || latestMymineEvent.blind_message;
    if (!text) return;
    setMyTranscriptions((prev) => {
      const idx = prev.findIndex((t) => t.id === pendingId);
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], text, status: 'done' };
      return next;
    });
    setPendingId(null);
  }, [latestMymineEvent, pendingId]);

  const onGestureCaptured = useCallback(() => {
    /* La capture locale (MediaPipe) gère sa propre file de gestes détectés
       et l'affiche en bas de la caméra. Le traitement par l'API se fait
       quand l'utilisateur clique « Envoyer ». */
  }, []);

  /* ============================================================
   * Sous-titres / transcription des AUTRES participants
   * ============================================================ */
  const useLiveSocketTranscriptions = !Array.isArray(syntheticTranscriptionLines);

  useEffect(() => {
    if (!useLiveSocketTranscriptions) return undefined;
    const onTranscription = (chunk) => {
      if (!chunk) return;
      if (!chunk.isFinal) return;
      setLines((prev) => [
        ...prev,
        {
          id: makeLineId(),
          speakerId: chunk.speakerId,
          speakerName: chunk.speakerName,
          speakerProfile: chunk.speakerProfile,
          text: chunk.text,
          timestamp: chunk.timestamp,
        },
      ]);
      setActiveSpeakerId(chunk.speakerId);
    };

    const onUpdated = ({ isSpeaking, id }) => {
      if (isSpeaking) setActiveSpeakerId(id);
    };

    socket.on('transcription-chunk', onTranscription);
    socket.on('participant-updated', onUpdated);
    return () => {
      socket.off('transcription-chunk', onTranscription);
      socket.off('participant-updated', onUpdated);
    };
  }, [useLiveSocketTranscriptions]);

  useEffect(() => {
    if (!Array.isArray(syntheticTranscriptionLines)) return;
    setLines(syntheticTranscriptionLines);
    const last = syntheticTranscriptionLines[syntheticTranscriptionLines.length - 1];
    if (last?.speakerId) setActiveSpeakerId(last.speakerId);
  }, [syntheticTranscriptionLines]);

  const lastCaption = useMemo(
    () => latestMymineEvent?.subtitle || lines[lines.length - 1]?.text || '',
    [latestMymineEvent?.subtitle, lines],
  );
  const lastGloses = latestMymineEvent?.lsf_gloses || '';
  const dense = Boolean(demoDenseLayout);
  const expanded = Boolean(demoExpandedViewport) && !dense;
  const simDemo = Boolean(demoSimulatedSignerOnly);
  const expandedTight = expanded && simDemo;

  const signerDemoGloses = useMemo(() => {
    if (!simDemo) return lastGloses;
    const base = (lastGloses || '').trim();
    if (!base) return `REUNION COMMUNICATION LSF ${DEMO_LSF_EXTRA_GLOSES}`;
    return `${base} ${DEMO_LSF_EXTRA_GLOSES}`;
  }, [simDemo, lastGloses]);

  const stageSignerSize = dense ? 186 : expandedTight ? 244 : expanded ? 262 : 216;
  const showPresenterScreen = Boolean(isSharing && presenterScreenStream);

  const rootClass = dense
    ? 'min-h-0 w-full px-2 py-2 text-[13px] sm:px-3 sm:py-3 sm:text-[14px]'
    : expandedTight
      ? 'h-auto min-h-full w-full px-3 py-4 text-[14px] sm:px-5 sm:py-5'
      : expanded
        ? 'h-auto min-h-full w-full px-4 py-5 text-[15px] sm:px-8 sm:py-7'
        : 'min-h-screen w-full px-6 py-10';

  const innerWrapClass = dense
    ? 'mx-auto w-full max-w-none space-y-2'
    : expandedTight
      ? 'mx-auto w-full max-w-[min(100%,72rem)] space-y-3'
      : expanded
        ? 'mx-auto w-full max-w-[min(100%,92rem)] space-y-5'
        : 'mx-auto w-full max-w-7xl space-y-4';

  return (
    <div className={rootClass} style={{ backgroundColor: '#F4F7FB', color: '#1F2D4A' }}>
      <div className={innerWrapClass}>

        {/* ============ HEADER ============ */}
        <div className={`rounded-2xl border border-[#DDE5EF] bg-[#FFFFFF] ${dense ? 'p-3' : expandedTight ? 'p-4' : expanded ? 'p-5 sm:p-6' : 'p-4'}`}>
          <div className="text-lg font-extrabold" style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}>
            Salle {roomId}
          </div>
          <div className="mt-1 text-sm text-[#607089]" style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}>
            En haut, vous voyez les autres participants et leur écran partagé. En bas, vous signez avec vos mains — c'est transcrit en direct.
          </div>
        </div>

        {/* ============ HAUT — Participants, partage d'écran, votre visage ============ */}
        <section
          className={`rounded-2xl border bg-white ${dense ? 'p-3' : expandedTight ? 'p-3 sm:p-4' : expanded ? 'p-4 sm:p-5' : 'p-3'}`}
          style={{ borderColor: '#DDE5EF', boxShadow: '0 6px 20px rgba(31,45,74,0.05)' }}
        >
          <div className="mb-2 flex flex-wrap items-start justify-between gap-2 px-1 sm:items-center">
            <div>
              <div
                className={`font-bold text-[#1F2D4A] ${dense ? 'text-base' : expandedTight ? 'text-base sm:text-lg' : expanded ? 'text-lg sm:text-xl' : 'text-base'}`}
                style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}
              >
                La réunion
              </div>
              <div
                className={`text-[#607089] ${dense ? 'max-w-[95%] text-[11px] leading-snug' : expandedTight ? 'mt-1 max-w-[40rem] text-xs' : expanded ? 'mt-1 max-w-[52rem] text-sm' : 'text-xs'}`}
                style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}
              >
                Les visages des autres, votre propre visage, et l'écran partagé.
              </div>
            </div>
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider"
              style={{ borderColor: '#DDE5EF', background: '#E6F0FB', color: '#1F5FBE', fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#3D8BF0', boxShadow: '0 0 8px #3D8BF0' }} />
              {participants?.length || 0} participant{(participants?.length || 0) > 1 ? 's' : ''}
            </span>
          </div>

          <PresenterScreenEmbed stream={showPresenterScreen ? presenterScreenStream : null} label={presenterScreenLabel} />

          {/* Vidéos (hauteur réduite en démo LSF simulée : le focus est le bonhomme bâton) */}
          <div
            className={
              simDemo && dense && !showPresenterScreen
                ? 'max-h-[min(170px,40vh)] overflow-y-auto'
                : simDemo && expandedTight && !showPresenterScreen
                  ? 'max-h-[min(22vh,200px)] overflow-hidden'
                  : ''
            }
          >
            <VideoGrid
              participants={participants}
              localStream={localStream}
              remoteStreams={remoteStreams}
              localTileParticipant={localTileParticipant}
              localSocketId={localSocketId ?? socket.id}
            />
          </div>

          {/* Bandeau sous-titre + avatar LSF compact */}
          <div
            className={
              simDemo
                ? dense
                  ? 'mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(132px,200px)_1fr] sm:grid-rows-1'
                  : expandedTight
                    ? 'mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(200px,280px)_1fr]'
                    : 'mt-3 grid grid-cols-1 gap-3 md:grid-cols-[minmax(200px,260px)_1fr]'
                : dense
                  ? 'mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_minmax(0,120px)]'
                  : expandedTight
                    ? 'mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_minmax(200px,300px)]'
                    : expanded
                      ? 'mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_minmax(200px,300px)]'
                      : 'mt-3 grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]'
            }
          >
            {simDemo ? (
              <>
                <div
                  className="flex items-center justify-center rounded-2xl border p-2 sm:p-3"
                  style={{ borderColor: '#3D8BF0', background: 'linear-gradient(180deg,#fff,#E6F0FB)' }}
                >
                  <SignLanguageAvatar
                    text={lastCaption}
                    gloses={signerDemoGloses}
                    compact
                    figureSize={dense ? 172 : expandedTight ? 188 : 196}
                    signCycleMs={360}
                  />
                </div>
                <div
                  className={`flex flex-col justify-center rounded-2xl border ${dense ? 'px-3 py-2' : expandedTight ? 'px-4 py-3' : 'px-4 py-3'}`}
                  style={{ borderColor: '#DDE5EF', background: '#F4F7FB' }}
                >
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider" style={{ color: '#607089', fontFamily: "'JetBrains Mono', monospace" }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#3D8BF0' }} /> Sous-titre en direct
                  </div>
                  <div
                    className={`font-semibold text-[#1F2D4A] ${dense ? 'text-[13px]' : expandedTight ? 'mt-1 text-sm sm:text-[15px]' : expanded ? 'mt-1 text-base sm:text-lg' : 'mt-1 text-[15px]'}`}
                    style={{ fontFamily: "'Open Sans', sans-serif" }}
                  >
                    {lastCaption || (
                      <span style={{ color: '#A0ABBD', fontWeight: 400 }}>
                        En attente de parole…
                      </span>
                    )}
                  </div>
                  {signerDemoGloses ? (
                    <div className="mt-1 text-[11px]" style={{ color: '#607089', fontFamily: "'JetBrains Mono', monospace" }}>
                      LSF : {signerDemoGloses}
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <div
                  className={`flex flex-col justify-center rounded-2xl border ${dense ? 'px-3 py-2' : expanded ? 'px-5 py-4' : 'px-4 py-3'}`}
                  style={{ borderColor: '#DDE5EF', background: '#F4F7FB' }}
                >
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider" style={{ color: '#607089', fontFamily: "'JetBrains Mono', monospace" }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#3D8BF0' }} /> Sous-titre en direct
                  </div>
                  <div
                    className={`font-semibold text-[#1F2D4A] ${dense ? 'text-[13px]' : expanded ? 'mt-1 text-base sm:text-lg' : 'mt-1 text-[15px]'}`}
                    style={{ fontFamily: "'Open Sans', sans-serif" }}
                  >
                    {lastCaption || (
                      <span style={{ color: '#A0ABBD', fontWeight: 400 }}>
                        En attente de parole…
                      </span>
                    )}
                  </div>
                  {lastGloses ? (
                    <div className="mt-1 text-[11px]" style={{ color: '#607089', fontFamily: "'JetBrains Mono', monospace" }}>
                      LSF : {lastGloses}
                    </div>
                  ) : null}
                </div>

                <div
                  className="flex items-center justify-center rounded-2xl border p-2"
                  style={{ borderColor: '#DDE5EF', background: 'white' }}
                >
                  <SignLanguageAvatar text={lastCaption} gloses={lastGloses} compact />
                </div>
              </>
            )}
          </div>

          {/* Description IA quand quelqu'un partage son écran */}
          {isSharing ? (
            <div className="mt-3 rounded-2xl border bg-[#E6F0FB] p-3" style={{ borderColor: '#C2CFE0' }}>
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider" style={{ color: '#1F5FBE', fontFamily: "'JetBrains Mono', monospace" }}>
                <span>Écran partagé · description</span>
              </div>
              <div className="mt-1 text-sm text-[#1F2D4A]" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                {latestDescription || 'L\'assistant décrit ce qui est montré…'}
              </div>
              {presenterNote ? (
                <div className="mt-2 text-sm italic text-[#1F5FBE]" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                  Présentateur : « {presenterNote} »
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        {/* ============ TOOLBAR ============ */}
        <Toolbar
          isMuted={isMuted}
          videoEnabled={videoEnabled}
          handRaised={handRaised}
          isSharing={Boolean(isLocalPresenter)}
          showMic={false}
          extraLeft={
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold text-[#1F2D4A]" style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}>
                Ma voix
              </div>
              <select
                value={voiceHint}
                onChange={(e) => setVoiceHint(e.target.value)}
                className={`rounded-xl border border-[#DDE5EF] bg-[#EBF1F9] text-sm text-[#1F2D4A] outline-none focus:border-[#3D8BF0] ${dense ? 'px-2 py-2' : 'px-3 py-3'}`}
                style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}
              >
                <option value="woman voice">Voix de femme</option>
                <option value="male voice">Voix d'homme</option>
              </select>
            </div>
          }
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
          onToggleScreenShare={() => {
            if (isLocalPresenter) stopShare?.();
            else startShare?.('', 'deaf');
          }}
        />

        {/* ============ BAS — Caméra qui voit vos mains + transcription via API ============ */}
        <section
          className={`rounded-2xl border bg-white ${dense ? 'p-3' : expandedTight ? 'p-3 sm:p-4' : expanded ? 'p-4 sm:p-5' : 'p-3'}`}
          style={{ borderColor: '#DDE5EF', boxShadow: '0 6px 20px rgba(31,45,74,0.05)' }}
        >
          <div className="mb-2 flex flex-wrap items-start justify-between gap-2 px-1 sm:items-center">
            <div>
              <div
                className={`font-bold text-[#1F2D4A] ${dense ? 'text-base' : expandedTight ? 'text-base sm:text-lg' : expanded ? 'text-lg sm:text-xl' : 'text-base'}`}
                style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}
              >
                {simDemo ? 'Interprète LSF (démo)' : 'Vos mains, votre voix'}
              </div>
              <div
                className={`text-[#607089] ${dense ? 'max-w-[95%] text-[11px] leading-snug' : expandedTight ? 'mt-1 max-w-[40rem] text-xs' : expanded ? 'mt-1 max-w-[52rem] text-sm' : 'text-xs'}`}
                style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}
              >
                {simDemo
                  ? 'Pas de caméra réelle : le bonhomme bâton enchaîne les gloses de la scène pour la capture vidéo.'
                  : 'Placez vos mains dans le cadre. Vos signes sont suivis en direct, puis transcrits en phrase claire pour les autres participants.'}
              </div>
            </div>
            <span
              className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider"
              style={{ borderColor: '#DDE5EF', background: '#E6F0FB', color: '#1F5FBE', fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
            >
              {simDemo ? 'Bonhomme bâton · simulation' : 'Suivi MediaPipe · transcription via API'}
            </span>
          </div>

          {simDemo ? (
            <div
              className="rounded-2xl border bg-gradient-to-b from-[#E6F0FB] to-white p-4 sm:p-5"
              style={{ borderColor: '#3D8BF0', boxShadow: '0 8px 28px rgba(61,139,240,0.12)' }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-semibold text-[#1F5FBE]" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                  Vue principale — signes simulés
                </div>
                <span
                  className="rounded-full border border-[#3D8BF0] bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#1F5FBE]"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Démo sans caméra
                </span>
              </div>
              <div className="mt-3 flex flex-col items-center justify-center gap-2 sm:mt-4">
                <StickFigureSigner
                  gloses={signerDemoGloses}
                  active
                  size={stageSignerSize}
                  accent="#1F5FBE"
                  signCycleMs={340}
                />
                <p className="max-w-lg text-center text-[11px] text-[#607089]" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                  Les poses changent à chaque mot-clé LSF ; la liste inclut les gloses de la scène et une séquence de démonstration.
                </p>
              </div>
            </div>
          ) : (
            <GestureCaptureMirror
              onCapture={onGestureCaptured}
              aspect="16/9"
              maxMainHeight={dense ? 200 : undefined}
              autoStart={!dense}
            />
          )}

          {/* Transcription officielle (reformulée par l'API) */}
          <div className={`rounded-2xl border ${dense ? 'p-3' : 'p-4'}`} style={{ borderColor: '#DDE5EF', background: '#F4F7FB' }}>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-[#1F2D4A]" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                Ce que vous avez dit (transcrit par l'assistant)
              </div>
              {pendingId ? (
                <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: '#3D8BF0', fontFamily: "'JetBrains Mono', monospace" }}>
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: '#3D8BF0' }} />
                  Transcription en cours…
                </span>
              ) : null}
            </div>

            {myTranscriptions.length === 0 ? (
              <div className={`mt-2 ${dense ? 'text-[11px] leading-snug' : 'text-sm'}`} style={{ color: '#A0ABBD', fontFamily: "'Open Sans', sans-serif" }}>
                {dense
                  ? "Envoyez vos signes au-dessus : l'assistant les reformule et les diffuse aux autres."
                  : "Quand vous cliquez sur « Envoyer à la réunion » au-dessus, votre suite de signes est envoyée à l'assistant qui la reformule en français — et la diffuse en voix haute aux autres."}
              </div>
            ) : (
              <ul className="mt-2 space-y-2">
                {myTranscriptions.slice().reverse().map((t) => (
                  <li
                    key={t.id}
                    className="rounded-xl border bg-white p-3"
                    style={{ borderColor: '#DDE5EF' }}
                  >
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-wider" style={{ color: '#607089', fontFamily: "'JetBrains Mono', monospace" }}>
                      <span>Signes : {t.gloses.join(' · ')}</span>
                      <span style={{ color: t.status === 'done' ? '#1F5FBE' : '#A0ABBD' }}>
                        {t.status === 'done' ? '✓ transcrit' : '… en attente'}
                      </span>
                    </div>
                    <div className="mt-1 text-[14px] text-[#1F2D4A]" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                      {t.text ? `« ${t.text} »` : (
                        <span style={{ color: '#A0ABBD' }}>L'assistant traite votre message…</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Carte « Partager mon écran » — bien visible pour les sourds-muets */}
          <div className="mt-3">
            {!isLocalPresenter ? (
              <div
                className={`flex flex-col items-stretch rounded-2xl border bg-white sm:flex-row sm:items-center sm:justify-between ${dense ? 'gap-2 p-3' : 'gap-3 p-4'}`}
                style={{ borderColor: '#DDE5EF' }}
              >
                <div>
                  <div className="text-sm font-semibold text-[#1F2D4A]" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                    Vous voulez montrer quelque chose ?
                  </div>
                  <div className="mt-0.5 text-xs text-[#607089]" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                    Partagez votre écran. Les autres le verront en direct, et l'assistant le décrira pour ceux qui ne voient pas.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => startShare?.('', 'deaf')}
                  className="shrink-0 rounded-xl bg-[#3D8BF0] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                  style={{ fontFamily: "'Open Sans', sans-serif", boxShadow: '0 8px 20px rgba(61,139,240,0.22)' }}
                >
                  Partager mon écran
                </button>
              </div>
            ) : (
              <div
                className={`flex flex-col items-stretch rounded-2xl border sm:flex-row sm:items-center sm:justify-between ${dense ? 'gap-2 p-3' : 'gap-3 p-4'}`}
                style={{ borderColor: '#C2CFE0', background: '#E6F0FB' }}
              >
                <div>
                  <div className="text-sm font-semibold text-[#1F5FBE]" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                    Vous partagez votre écran
                  </div>
                  <div className="mt-0.5 text-xs text-[#607089]" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                    Tout le monde voit ce que vous montrez. Écrivez ci-dessous pour commenter.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => stopShare?.()}
                  className="shrink-0 rounded-xl border border-[#DDE5EF] bg-white px-4 py-2.5 text-sm font-semibold text-[#1F2D4A] transition hover:bg-[#F4F7FB]"
                  style={{ fontFamily: "'Open Sans', sans-serif" }}
                >
                  Arrêter le partage
                </button>
              </div>
            )}
          </div>

          {/* Champ texte pour parler par écrit */}
          <div className="mt-3">
            <TextToSpeechInput
              onSend={(text) => {
                sendChatMessage?.(text, { voiceHint });
                if (isLocalPresenter) submitPresenterNote?.(text);
              }}
              placeholder={isLocalPresenter ? 'Expliquez ce que vous montrez…' : 'Écrivez — votre message sera lu à voix haute.'}
            />
          </div>
        </section>

        {/* ============ Panneaux secondaires ============ */}
        <div
          className={
            dense
              ? 'grid grid-cols-1 gap-2'
              : expandedTight
                ? 'grid grid-cols-1 gap-3 lg:grid-cols-[1fr_minmax(260px,360px)]'
                : expanded
                  ? 'grid grid-cols-1 gap-5 lg:grid-cols-[1fr_minmax(320px,440px)]'
                  : 'grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]'
          }
        >
          <TranscriptionFeed
            lines={lines}
            activeSpeakerId={activeSpeakerId}
            scrollMaxClassName={
              dense
                ? 'max-h-[min(18vh,120px)]'
                : expandedTight
                  ? 'max-h-[min(26vh,200px)]'
                  : expanded
                    ? 'max-h-[min(42vh,420px)]'
                    : undefined
            }
          />
          <div className={dense ? 'space-y-2' : 'space-y-4'}>
            <ParticipantList participants={participants} />
            <ChatPanel messages={messages} onSend={(text) => sendChatMessage?.(text, { voiceHint })} />
          </div>
        </div>
      </div>
    </div>
  );
}
