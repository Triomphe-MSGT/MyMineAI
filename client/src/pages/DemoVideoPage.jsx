import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, LayoutGrid, Maximize2 } from 'lucide-react';
import { DemoViewportFit } from '../components/shared/DemoViewportFit.jsx';
import { useSimulatedDemoStreams } from '../demo/useSimulatedDemoStreams.js';
import { StandardLayout } from '../components/standard/StandardLayout.jsx';
import { BlindLayout } from '../components/blind/BlindLayout.jsx';
import { DeafLayout } from '../components/deaf/DeafLayout.jsx';

const ROOM_ID = 'mm-demo-video';

const SID = {
  alice: 'demo-sid-alice',
  bob: 'demo-sid-bob',
  carla: 'demo-sid-carla',
};

const PID = {
  alice: 'p-alice',
  bob: 'p-bob',
  carla: 'p-carla',
};

const PHASE_COUNT = 11;

function lineId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `ln-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function msgId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `m-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * État synchronisé des trois interfaces pour une capture vidéo (sans serveur ni WebRTC).
 * Réutilise StandardLayout, BlindLayout et DeafLayout avec les mêmes flux de données qu’en réunion.
 */
function buildScenario(phase) {
  const messages = [];
  const transcriptionLines = [];

  /** Phases 7–9 : Alice partage un écran simulé (graphique). */
  const aliceSharesScreen = phase >= 7 && phase <= 9;

  if (phase >= 1) {
    messages.push({
      id: msgId(),
      senderId: PID.alice,
      senderName: 'Alice',
      senderProfile: 'standard',
      text: "Bonjour tout le monde — on synchronise les trois interfaces pour la démo.",
      timestamp: Date.now() - 8000,
    });
  }
  if (phase >= 2) {
    transcriptionLines.push({
      id: lineId(),
      speakerId: PID.alice,
      speakerName: 'Alice',
      speakerProfile: 'standard',
      text: 'Je vous montre le tableau de bord : les ventes progressent bien ce trimestre.',
      timestamp: Date.now() - 6000,
    });
  }
  if (phase >= 3) {
    messages.push({
      id: msgId(),
      senderId: PID.bob,
      senderName: 'Bob',
      senderProfile: 'blind',
      text: 'Parfait, je suis à l’écoute. Décris-moi les courbes quand tu zoomes.',
      timestamp: Date.now() - 4000,
    });
  }
  if (phase >= 5) {
    transcriptionLines.push({
      id: lineId(),
      speakerId: PID.bob,
      speakerName: 'Bob',
      speakerProfile: 'blind',
      text: 'Peux-tu confirmer le chiffre sur la colonne de droite ?',
      timestamp: Date.now() - 3500,
    });
  }
  if (phase >= 6) {
    messages.push({
      id: msgId(),
      senderId: PID.carla,
      senderName: 'Carla',
      senderProfile: 'deaf',
      text: 'Oui — je vois le graphique. Le pic est bien à mars.',
      timestamp: Date.now() - 2000,
    });
  }
  if (phase >= 7) {
    transcriptionLines.push({
      id: lineId(),
      speakerId: PID.alice,
      speakerName: 'Alice',
      speakerProfile: 'standard',
      text: "J’active le partage d’écran : vous devriez voir le slide « Ventes trimestrielles » avec les barres animées.",
      timestamp: Date.now() - 1500,
    });
    messages.push({
      id: msgId(),
      senderId: PID.alice,
      senderName: 'Alice',
      senderProfile: 'standard',
      text: '🖥️ Partage d’écran lancé (flux simulé côté démo).',
      timestamp: Date.now() - 1200,
    });
  }
  if (phase >= 8) {
    transcriptionLines.push({
      id: lineId(),
      speakerId: PID.alice,
      speakerName: 'Alice',
      speakerProfile: 'standard',
      text: 'La barre mars est à plus douze pour cent par rapport à janvier — c’est le run-rate qu’on avait cadré en comité.',
      timestamp: Date.now() - 900,
    });
  }
  if (phase >= 9) {
    transcriptionLines.push({
      id: lineId(),
      speakerId: PID.carla,
      speakerName: 'Carla',
      speakerProfile: 'deaf',
      text: 'OK vu sur le grand graphique, merci pour le zoom sur mars.',
      timestamp: Date.now() - 600,
    });
  }
  if (phase >= 10) {
    transcriptionLines.push({
      id: lineId(),
      speakerId: PID.alice,
      speakerName: 'Alice',
      speakerProfile: 'standard',
      text: "J’arrête le partage d’écran. On poursuit à l’oral si vous avez des questions.",
      timestamp: Date.now() - 300,
    });
  }

  let latestStandard = null;
  let latestBlind = null;
  let latestDeaf = null;
  const ts = Date.now() - 3000;

  if (phase >= 4 && !aliceSharesScreen) {
    latestStandard = {
      profile: 'standard',
      summary: 'Alice présente les ventes en hausse ; Bob demande une confirmation visuelle ; Carla valide le pic en mars.',
      priority: 'info',
      intent: 'parole',
      timestamp: ts,
    };
    latestBlind = {
      profile: 'blind',
      text: 'Alice annonce un tableau de bord positif. Bob demande une confirmation sur la colonne de droite. Carla confirme un pic en mars.',
      tts: true,
      priority: 'info',
      intent: 'parole',
      timestamp: ts,
    };
    latestDeaf = {
      profile: 'deaf',
      subtitle: 'Alice : ventes en hausse. Bob : confirmation colonne droite. Carla : pic en mars.',
      lsf_gloses: 'ALICE VENTES HAUSSE BOB CONFIRMER DROITE CARLA PIC MARS',
      needsLSF: true,
      priority: 'info',
      intent: 'parole',
      timestamp: ts,
    };
  }

  if (aliceSharesScreen) {
    latestStandard = {
      profile: 'standard',
      summary:
        phase >= 8
          ? 'Partage écran : Alice commente la barre mars (+12 %). Carla confirme visuellement.'
          : 'Alice lance le partage d’écran — graphique trimestriel affiché pour Bob et Carla.',
      priority: 'info',
      intent: 'partage_ecran',
      timestamp: ts,
    };
    latestBlind = {
      profile: 'blind',
      text:
        phase >= 8
          ? 'Alice décrit une barre mars en forte hausse. Carla dit voir le grand graphique.'
          : 'Alice annonce un partage d’écran avec un graphique de ventes animé.',
      tts: true,
      priority: 'info',
      intent: 'partage_ecran',
      timestamp: ts,
    };
    latestDeaf = {
      profile: 'deaf',
      subtitle:
        phase >= 8
          ? 'Alice : barre mars +12 %. Carla : vu sur le graphique.'
          : 'Alice : partage écran — graphique ventes.',
      lsf_gloses: phase >= 8 ? 'ALICE PARTAGE ECRAN MARS DOUZE CARLA CONFIRMER' : 'ALICE PARTAGE ECRAN VENTES GRAPH',
      needsLSF: true,
      priority: 'info',
      intent: 'partage_ecran',
      timestamp: ts,
    };
  }

  const participantsBase = (order) => {
    const map = {
      alice: {
        socketId: SID.alice,
        id: PID.alice,
        name: 'Alice',
        profile: 'standard',
        isMuted: false,
        videoEnabled: !aliceSharesScreen,
        isSpeaking: phase === 2 || phase === 7 || phase === 8,
        handRaised: false,
      },
      bob: {
        socketId: SID.bob,
        id: PID.bob,
        name: 'Bob',
        profile: 'blind',
        isMuted: false,
        videoEnabled: true,
        isSpeaking: phase === 5,
        handRaised: phase >= 3 && phase <= 8,
      },
      carla: {
        socketId: SID.carla,
        id: PID.carla,
        name: 'Carla',
        profile: 'deaf',
        isMuted: true,
        videoEnabled: true,
        isSpeaking: phase === 6 || phase === 9,
        handRaised: false,
      },
    };
    return order.map((k) => map[k]);
  };

  const latestDescription = aliceSharesScreen
    ? 'Graphique en barres (simulation) : janvier à mars, montée régulière ; la barre mars est surlignée avec l’étiquette « +12 % ». Grille de repères horizontale pour lecture des ordonnées.'
    : '';

  const presenterNote =
    aliceSharesScreen && phase >= 8
      ? 'Je commente à voix haute : la courbe bleue, c’est le run-rate — mars dépasse notre objectif trimestriel.'
      : '';

  return {
    messages,
    transcriptionLines,
    latestStandard,
    latestBlind,
    latestDeaf,
    participantsStandard: participantsBase(['alice', 'bob', 'carla']),
    participantsBlind: participantsBase(['bob', 'alice', 'carla']),
    participantsDeaf: participantsBase(['carla', 'alice', 'bob']),
    participantAlice: {
      id: PID.alice,
      name: 'Alice',
      profile: 'standard',
      isMuted: false,
      videoEnabled: !aliceSharesScreen,
    },
    participantBob: {
      id: PID.bob,
      name: 'Bob',
      profile: 'blind',
      isMuted: false,
      videoEnabled: true,
    },
    participantCarla: {
      id: PID.carla,
      name: 'Carla',
      profile: 'deaf',
      isMuted: true,
      videoEnabled: true,
    },
    aliceSharesScreen,
    isScreenSharing: aliceSharesScreen,
    isLocalPresenter: aliceSharesScreen,
    screenShareDeaf: aliceSharesScreen,
    latestDescription,
    presenterNote,
  };
}

const noop = () => {};
const noopAsync = async () => {};

export function DemoVideoPage() {
  const [phase, setPhase] = useState(0);
  /** Une seule interface agrandie pour la présentation, ou null pour les trois colonnes. */
  const [focus, setFocus] = useState(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setFocus(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const scenario = useMemo(() => buildScenario(phase), [phase]);
  const { messages, transcriptionLines } = scenario;
  const sim = useSimulatedDemoStreams();

  const remoteStreamsStandard = useMemo(() => {
    const m = new Map();
    if (sim.bobWebcam) m.set(SID.bob, sim.bobWebcam);
    if (sim.carlaWebcam) m.set(SID.carla, sim.carlaWebcam);
    return m;
  }, [sim.bobWebcam, sim.carlaWebcam]);

  const remoteStreamsCarla = useMemo(() => {
    const m = new Map();
    if (sim.aliceWebcam) m.set(SID.alice, sim.aliceWebcam);
    if (sim.bobWebcam) m.set(SID.bob, sim.bobWebcam);
    return m;
  }, [sim.aliceWebcam, sim.bobWebcam]);

  const fitDepsStandard = `${phase}-${focus}-${scenario.screenShareDeaf}-${scenario.isScreenSharing}-std`;
  const fitDepsBlind = `${phase}-${focus}-blind`;
  const fitDepsDeaf = `${phase}-${focus}-${scenario.screenShareDeaf}-deaf`;

  const sendMessageDemo = useCallback(() => {
    /* Les messages de la démo sont entièrement pilotés par la timeline. */
  }, []);

  const localTile = (p) => ({
    name: p.name,
    profile: p.profile,
    isMuted: Boolean(p.isMuted),
    videoEnabled: Boolean(p.videoEnabled),
    isSpeaking: false,
  });

  const blindAudioDemo = useMemo(() => {
    const list = scenario.participantsBlind;
    const selfSpeaking = list.some((p) => p.profile === 'blind' && p.isSpeaking);
    const othersSpeaking = list.some((p) => p.profile !== 'blind' && p.isSpeaking);
    return { selfSpeaking, othersSpeaking };
  }, [scenario.participantsBlind]);

  const blindLayoutProps = {
    speak: noop,
    messages,
    participants: scenario.participantsBlind,
    updateMyState: noop,
    toggleMic: noop,
    transcriptionLines,
    demoAudioReactivity: blindAudioDemo,
  };

  return (
    <div
      className="flex h-[100dvh] max-h-[100dvh] min-h-0 w-full flex-col overflow-hidden"
      style={{ background: '#0b1420', color: '#E6F0FB' }}
    >
      <div className="z-50 shrink-0 border-b border-white/10 bg-[#0b1420]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-[1920px] flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-extrabold" style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}>
              MyMine — démo vidéo (triple interface)
            </div>
            <div className="text-xs text-white/60" style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}>
              Scènes manuelles · Précédente / Suivante · flux caméra / écran simulés (canvas) · pas de WebSocket
              {focus ? ' · Échap : revenir aux 3 vues' : ''}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {focus ? (
              <button
                type="button"
                onClick={() => setFocus(null)}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-semibold text-white hover:bg-white/20"
              >
                <LayoutGrid className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Afficher les 3
              </button>
            ) : null}
            <span className="rounded-full border border-white/15 px-3 py-1 text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              scène {phase + 1}/{PHASE_COUNT}
            </span>
            <button
              type="button"
              onClick={() => setPhase((p) => (p - 1 + PHASE_COUNT) % PHASE_COUNT)}
              className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/15"
            >
              <ChevronLeft className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Précédente
            </button>
            <button
              type="button"
              onClick={() => setPhase((p) => (p + 1) % PHASE_COUNT)}
              className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/15"
            >
              Suivante
              <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
            </button>
            <Link to="/select" className="rounded-full border border-[#3D8BF0] bg-[#3D8BF0] px-3 py-1 text-xs font-semibold text-white">
              Vraie réunion
            </Link>
          </div>
        </div>
      </div>

      <div
        className={
          focus
            ? 'mx-auto grid min-h-0 w-full max-w-[1920px] flex-1 grid-cols-1 grid-rows-1 gap-2 p-2'
            : 'mx-auto grid min-h-0 w-full max-w-[1920px] flex-1 grid-cols-1 grid-rows-[repeat(3,minmax(0,1fr))] gap-2 p-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.42fr)] xl:grid-rows-1'
        }
      >
        <section
          className={`relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-white ${
            focus && focus !== 'standard' ? 'hidden' : ''
          }`}
        >
          <div
            className="flex items-center justify-between gap-2 border-b border-[#DDE5EF] bg-[#F4F7FB] px-3 py-2"
            style={{ fontFamily: "'Open Sans', sans-serif" }}
          >
            <span className="text-xs font-bold text-[#1F5FBE]">Standard — Alice</span>
            {!focus ? (
              <button
                type="button"
                onClick={() => setFocus('standard')}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[#C2CFE0] bg-white px-2 py-1 text-[11px] font-semibold text-[#1F2D4A] hover:border-[#3D8BF0] hover:text-[#1F5FBE]"
                title="N’afficher que cette interface (présentation)"
              >
                <Maximize2 className="h-3.5 w-3.5" aria-hidden />
                Agrandir
              </button>
            ) : focus === 'standard' ? (
              <button
                type="button"
                onClick={() => setFocus(null)}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[#C2CFE0] bg-white px-2 py-1 text-[11px] font-semibold text-[#1F2D4A] hover:border-[#3D8BF0] hover:text-[#1F5FBE]"
              >
                <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
                Les 3 vues
              </button>
            ) : null}
          </div>
          <DemoViewportFit depsKey={fitDepsStandard} className="min-h-0 flex-1">
            <StandardLayout
              roomId={ROOM_ID}
              participant={scenario.participantAlice}
              participants={scenario.participantsStandard}
              localStream={sim.aliceWebcam}
              remoteStreams={remoteStreamsStandard}
              toggleMic={noop}
              toggleCamera={noop}
              updateMyState={noop}
              messages={messages}
              sendMessage={sendMessageDemo}
              screenStream={scenario.aliceSharesScreen ? sim.presentation : null}
              isScreenSharing={scenario.isScreenSharing}
              isLocalPresenter={scenario.isLocalPresenter}
              latestDescription={scenario.latestDescription}
              presenterNote={scenario.presenterNote}
              presenterProfile="standard"
              startShare={noopAsync}
              stopShare={noop}
              latestMymineEvent={scenario.latestStandard}
              localSocketId={SID.alice}
              localTileParticipant={localTile(scenario.participantAlice)}
              screenOverlayPlacement="contained"
            />
          </DemoViewportFit>
        </section>

        <section
          className={`flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-white ${
            focus ? 'hidden' : ''
          }`}
        >
          <div
            className="flex items-center justify-between gap-2 border-b border-[#DDE5EF] bg-[#F4F7FB] px-3 py-2"
            style={{ fontFamily: "'Open Sans', sans-serif" }}
          >
            <span className="text-xs font-bold text-[#1F5FBE]">Aveugle — Bob</span>
            <button
              type="button"
              onClick={() => setFocus('blind')}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[#C2CFE0] bg-white px-2 py-1 text-[11px] font-semibold text-[#1F2D4A] hover:border-[#3D8BF0] hover:text-[#1F5FBE]"
              title="Plein écran (interface aveugle)"
            >
              <Maximize2 className="h-3.5 w-3.5" aria-hidden />
              Agrandir
            </button>
          </div>
          <DemoViewportFit depsKey={fitDepsBlind} className="min-h-0 flex-1">
            <BlindLayout {...blindLayoutProps} layoutVariant="default" />
          </DemoViewportFit>
        </section>

        <section
          className={`flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-white ${
            focus ? 'hidden' : ''
          }`}
        >
          <div
            className="flex items-center justify-between gap-2 border-b border-[#DDE5EF] bg-[#F4F7FB] px-3 py-2"
            style={{ fontFamily: "'Open Sans', sans-serif" }}
          >
            <span className="text-xs font-bold text-[#1F5FBE]">Sourd · muet — Carla</span>
            <button
              type="button"
              onClick={() => setFocus('deaf')}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[#C2CFE0] bg-white px-2 py-1 text-[11px] font-semibold text-[#1F2D4A] hover:border-[#3D8BF0] hover:text-[#1F5FBE]"
              title="Plein écran (interface sourd · muet)"
            >
              <Maximize2 className="h-3.5 w-3.5" aria-hidden />
              Agrandir
            </button>
          </div>
          <DemoViewportFit depsKey={fitDepsDeaf} className="min-h-0 flex-1">
            <DeafLayout
              roomId={ROOM_ID}
              participant={scenario.participantCarla}
              participants={scenario.participantsDeaf}
              localStream={sim.carlaWebcam}
              remoteStreams={remoteStreamsCarla}
              toggleMic={noop}
              toggleCamera={noop}
              updateMyState={noop}
              messages={messages}
              sendChatMessage={noop}
              isSharing={scenario.screenShareDeaf}
              isLocalPresenter={false}
              presenterScreenStream={scenario.aliceSharesScreen ? sim.presentation : null}
              presenterScreenLabel="Alice · standard"
              startShare={noopAsync}
              stopShare={noop}
              latestDescription={scenario.latestDescription}
              presenterNote={scenario.presenterNote}
              presenterProfile="standard"
              submitPresenterNote={noop}
              latestMymineEvent={scenario.latestDeaf}
              emitMymineEvent={noop}
              syntheticTranscriptionLines={transcriptionLines}
              localTileParticipant={localTile(scenario.participantCarla)}
              localSocketId={SID.carla}
              demoDenseLayout
              demoSimulatedSignerOnly
            />
          </DemoViewportFit>
        </section>
      </div>

      {focus === 'deaf' ? (
        <div className="fixed inset-0 z-[90] flex flex-col bg-[#0b1420]">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
            <div className="text-sm font-extrabold text-white" style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}>
              Sourd · muet — Carla · plein écran
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setFocus(null)}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20"
              >
                <LayoutGrid className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Les 3 vues
              </button>
              <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/90" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                scène {phase + 1}/{PHASE_COUNT}
              </span>
              <button
                type="button"
                onClick={() => setPhase((p) => (p - 1 + PHASE_COUNT) % PHASE_COUNT)}
                className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15"
              >
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
                Précédente
              </button>
              <button
                type="button"
                onClick={() => setPhase((p) => (p + 1) % PHASE_COUNT)}
                className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15"
              >
                Suivante
                <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto" style={{ backgroundColor: '#F4F7FB' }}>
            <DeafLayout
              roomId={ROOM_ID}
              participant={scenario.participantCarla}
              participants={scenario.participantsDeaf}
              localStream={sim.carlaWebcam}
              remoteStreams={remoteStreamsCarla}
              toggleMic={noop}
              toggleCamera={noop}
              updateMyState={noop}
              messages={messages}
              sendChatMessage={noop}
              isSharing={scenario.screenShareDeaf}
              isLocalPresenter={false}
              presenterScreenStream={scenario.aliceSharesScreen ? sim.presentation : null}
              presenterScreenLabel="Alice · standard"
              startShare={noopAsync}
              stopShare={noop}
              latestDescription={scenario.latestDescription}
              presenterNote={scenario.presenterNote}
              presenterProfile="standard"
              submitPresenterNote={noop}
              latestMymineEvent={scenario.latestDeaf}
              emitMymineEvent={noop}
              syntheticTranscriptionLines={transcriptionLines}
              localTileParticipant={localTile(scenario.participantCarla)}
              localSocketId={SID.carla}
              demoDenseLayout={false}
              demoExpandedViewport
              demoSimulatedSignerOnly
            />
          </div>
        </div>
      ) : null}

      {focus === 'blind' ? (
        <div className="fixed inset-0 z-[90] flex flex-col bg-[#0b1420]">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
            <div className="text-sm font-extrabold text-white" style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}>
              Aveugle — Bob · plein écran
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setFocus(null)}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20"
              >
                <LayoutGrid className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Les 3 vues
              </button>
              <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/90" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                scène {phase + 1}/{PHASE_COUNT}
              </span>
              <button
                type="button"
                onClick={() => setPhase((p) => (p - 1 + PHASE_COUNT) % PHASE_COUNT)}
                className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15"
              >
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
                Précédente
              </button>
              <button
                type="button"
                onClick={() => setPhase((p) => (p + 1) % PHASE_COUNT)}
                className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15"
              >
                Suivante
                <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-white">
            <BlindLayout {...blindLayoutProps} layoutVariant="fullscreen" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
