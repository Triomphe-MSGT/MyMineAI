import { motion } from 'framer-motion';
import { Camera, CameraOff, Hand, ScanLine } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * GestureCaptureMirror — Capteur LSF réel
 *
 * • Ouvre la webcam locale
 * • Charge MediaPipe HandLandmarker (modèle officiel Google, ~7 Mo cdn)
 * • Suit les **vraies mains** : 21 points par main, tracking 30+ FPS
 * • Dessine sur un canvas overlay le squelette qui colle aux doigts
 * • Reconnaît des gestes simples à partir des landmarks (poing, main ouverte,
 *   pouce levé, V, pointage, OK, pinch) — sans réseau pour la classification
 * • Émet onCapture(label) à chaque NOUVEAU geste stable détecté
 *
 * Props :
 *   - onCapture(label) : callback, déclenché à chaque geste nouveau et stable
 *   - aspect : "16/9" par défaut (zone large)
 *   - autoStart : démarre la caméra au mount (défaut true)
 */

const MEDIAPIPE_WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
const MEDIAPIPE_MODEL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

/** Libellés affichés + aide à la composition de signes */
const GESTURE_HINT_FR = {
  'MAIN-OUVERTE': 'Bonjour',
  'POUCE-LEVE': 'Oui',
  POING: 'Non',
  PAIX: 'Deux',
  POINTER: 'Moi',
  PINCER: 'Petit / préciser',
  OK: 'OK',
  TROIS: 'Trois',
  ROCK: 'Rock',
};

/* connexions du squelette officiel MediaPipe (21 landmarks) */
const HAND_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],            // thumb
  [0,5],[5,6],[6,7],[7,8],            // index
  [5,9],[9,10],[10,11],[11,12],       // middle
  [9,13],[13,14],[14,15],[15,16],     // ring
  [13,17],[17,18],[18,19],[19,20],    // pinky
  [0,17],                             // palm
];

/* ------------------------------------------------------------------ */
/* Détection de gestes à partir des landmarks                          */
/* ------------------------------------------------------------------ */
function classifyHand(landmarks, handedness = 'Right') {
  if (!landmarks || landmarks.length !== 21) return null;
  const lm = landmarks;

  // Helpers
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const wrist = lm[0];
  const palm = { x: (lm[0].x + lm[5].x + lm[17].x) / 3, y: (lm[0].y + lm[5].y + lm[17].y) / 3 };

  // Doigt étendu si tip plus loin du poignet que pip (sur l'axe radial)
  const fingerExtended = (tipIdx, pipIdx, mcpIdx) => {
    const tipD = dist(lm[tipIdx], wrist);
    const pipD = dist(lm[pipIdx], wrist);
    const mcpD = dist(lm[mcpIdx], wrist);
    return tipD > pipD && pipD > mcpD * 0.9;
  };

  // Pouce : on regarde sur l'axe X (différent des autres doigts)
  const thumbExtended = (() => {
    const tip = lm[4];
    const ip  = lm[3];
    const mcp = lm[2];
    const dTip = dist(tip, palm);
    const dIp  = dist(ip,  palm);
    const dMcp = dist(mcp, palm);
    return dTip > dIp && dIp > dMcp * 0.95;
  })();

  const indexExt  = fingerExtended(8, 6, 5);
  const middleExt = fingerExtended(12, 10, 9);
  const ringExt   = fingerExtended(16, 14, 13);
  const pinkyExt  = fingerExtended(20, 18, 17);

  const extCount = [thumbExtended, indexExt, middleExt, ringExt, pinkyExt].filter(Boolean).length;

  // Pinch : distance pouce/index < 0.05
  const pinchDist = dist(lm[4], lm[8]);
  const handSize  = dist(lm[0], lm[9]) || 0.001;
  const pinchRatio = pinchDist / handSize;

  // OK : pinch + autres doigts étendus
  if (pinchRatio < 0.5 && middleExt && ringExt && pinkyExt) {
    return { gesture: 'OK', confidence: 0.9 };
  }
  // Pinch (préciser)
  if (pinchRatio < 0.45 && !middleExt && !ringExt && !pinkyExt) {
    return { gesture: 'PINCER', confidence: 0.8 };
  }
  // Poing
  if (extCount === 0) return { gesture: 'POING', confidence: 0.95 };
  // Pouce levé seulement
  if (thumbExtended && !indexExt && !middleExt && !ringExt && !pinkyExt) {
    return { gesture: 'POUCE-LEVE', confidence: 0.9 };
  }
  // Index seul → pointer
  if (!thumbExtended && indexExt && !middleExt && !ringExt && !pinkyExt) {
    return { gesture: 'POINTER', confidence: 0.95 };
  }
  // V (peace)
  if (indexExt && middleExt && !ringExt && !pinkyExt) {
    return { gesture: 'PAIX', confidence: 0.9 };
  }
  // 3 doigts
  if (indexExt && middleExt && ringExt && !pinkyExt) {
    return { gesture: 'TROIS', confidence: 0.85 };
  }
  // Rock (index + pinky)
  if (indexExt && !middleExt && !ringExt && pinkyExt) {
    return { gesture: 'ROCK', confidence: 0.85 };
  }
  // Tous étendus → main ouverte / bonjour
  if (extCount >= 4) return { gesture: 'MAIN-OUVERTE', confidence: 0.95 };

  return { gesture: '?', confidence: 0.4 };
}

/* ------------------------------------------------------------------ */
/* MAIN COMPONENT                                                     */
/* ------------------------------------------------------------------ */
export function GestureCaptureMirror({
  onCapture,
  autoStart = true,
  aspect = '16/9',
  /** Hauteur max (px) du cadre vidéo 16/9 — utile démo triple colonne. */
  maxMainHeight,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const landmarkerRef = useRef(null);
  const lastDetectionTsRef = useRef(0);
  const lastGestureRef = useRef({ label: null, stableCount: 0 });

  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState('');
  const [modelStatus, setModelStatus] = useState('idle'); // idle / loading / ready / error
  const [detectedHands, setDetectedHands] = useState(0);
  const [currentGestures, setCurrentGestures] = useState([]); // [{ label, hand }]
  const [history, setHistory] = useState([]); // [{ id, label, hand, ts }]
  const [fps, setFps] = useState(0);

  /* ---- Init MediaPipe HandLandmarker (lazy, sur 1er start) ---- */
  const ensureLandmarker = useCallback(async () => {
    if (landmarkerRef.current) return landmarkerRef.current;
    setModelStatus('loading');
    try {
      const vision = await import('@mediapipe/tasks-vision');
      const { HandLandmarker, FilesetResolver } = vision;
      const fileset = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM);

      const createWithDelegate = async (delegate) => HandLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: MEDIAPIPE_MODEL,
          delegate,
        },
        runningMode: 'VIDEO',
        numHands: 2,
        minHandDetectionConfidence: 0.4,
        minHandPresenceConfidence: 0.4,
        minTrackingConfidence: 0.4,
      });

      let handLandmarker = null;
      try {
        handLandmarker = await createWithDelegate('GPU');
      } catch {
        handLandmarker = await createWithDelegate('CPU');
      }

      landmarkerRef.current = handLandmarker;
      setModelStatus('ready');
      return handLandmarker;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Erreur chargement MediaPipe Hands:', e);
      setModelStatus('error');
      return null;
    }
  }, []);

  /* ---- Boucle de détection ---- */
  const tickRef = useRef({ count: 0, last: performance.now() });
  const detectLoop = useCallback(() => {
    if (!enabled) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const lm = landmarkerRef.current;
    if (!video || !canvas || !lm || video.readyState < 2 || video.videoWidth === 0) {
      rafRef.current = requestAnimationFrame(detectLoop);
      return;
    }

    const ctx = canvas.getContext('2d');
    const W = canvas.width = video.videoWidth;
    const H = canvas.height = video.videoHeight;
    ctx.clearRect(0, 0, W, H);

    let result = null;
    try {
      const ts = performance.now();
      if (ts - lastDetectionTsRef.current > 33) { // ~30 FPS max
        lastDetectionTsRef.current = ts;
        result = lm.detectForVideo(video, ts);
      }
    } catch (e) {
      // detection error
    }

    // FPS counter
    tickRef.current.count += 1;
    const now = performance.now();
    if (now - tickRef.current.last >= 1000) {
      setFps(tickRef.current.count);
      tickRef.current.count = 0;
      tickRef.current.last = now;
    }

    if (result && result.landmarks && result.landmarks.length > 0) {
      // Le canvas est dessiné en miroir (transform: scaleX(-1) on video) — on flip aussi le canvas
      ctx.save();
      ctx.translate(W, 0);
      ctx.scale(-1, 1);

      const detected = [];
      result.landmarks.forEach((landmarks, idx) => {
        const hand = result.handedness?.[idx]?.[0]?.categoryName || 'Right';

        // bbox
        let minX = 1, minY = 1, maxX = 0, maxY = 0;
        for (const p of landmarks) {
          if (p.x < minX) minX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.x > maxX) maxX = p.x;
          if (p.y > maxY) maxY = p.y;
        }
        const bx = minX * W - 10;
        const by = minY * H - 10;
        const bw = (maxX - minX) * W + 20;
        const bh = (maxY - minY) * H + 20;

        ctx.strokeStyle = 'rgba(61,139,240,0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(bx, by, bw, bh);
        ctx.setLineDash([]);

        // connexions (squelette)
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#3D8BF0';
        ctx.shadowColor = '#3D8BF0';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        for (const [a, b] of HAND_CONNECTIONS) {
          const pa = landmarks[a];
          const pb = landmarks[b];
          ctx.moveTo(pa.x * W, pa.y * H);
          ctx.lineTo(pb.x * W, pb.y * H);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // points
        for (let i = 0; i < landmarks.length; i += 1) {
          const p = landmarks[i];
          const isTip = [4, 8, 12, 16, 20].includes(i);
          const isWrist = i === 0;
          ctx.fillStyle = isTip ? '#FFFFFF' : '#E6F0FB';
          ctx.strokeStyle = '#3D8BF0';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(p.x * W, p.y * H, isWrist ? 7 : isTip ? 5 : 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }

        // gesture classification
        const g = classifyHand(landmarks, hand);
        if (g) {
          detected.push({ label: g.label || g.gesture, hand, conf: g.confidence, idx });
          // étiquette flottante (texte non miroité)
          ctx.save();
          ctx.scale(-1, 1);
          ctx.translate(-W, 0);
          const labelX = W - (maxX * W) - 4;
          const labelY = minY * H - 12;
          ctx.font = '600 16px Open Sans, system-ui';
          const padding = 8;
          const text = `${g.gesture} · ${hand === 'Left' ? '✋' : '🖐'}`;
          const m = ctx.measureText(text);
          ctx.fillStyle = 'rgba(31,95,190,0.92)';
          ctx.beginPath();
          // simple rect (since roundRect not always supported)
          ctx.rect(labelX, labelY - 18, m.width + padding * 2, 22);
          ctx.fill();
          ctx.fillStyle = 'white';
          ctx.fillText(text, labelX + padding, labelY - 2);
          ctx.restore();
        }
      });

      ctx.restore();

      setDetectedHands(result.landmarks.length);
      setCurrentGestures(detected.map((d) => ({ label: d.label, hand: d.hand })));

      // stabilisation : on émet un geste seulement s'il reste le même 4 frames d'affilée
      const primary = detected[0];
      if (primary) {
        const key = `${primary.hand}:${primary.label}`;
        if (lastGestureRef.current.label === key) {
          lastGestureRef.current.stableCount += 1;
          if (lastGestureRef.current.stableCount === 6) {
            // émission
            const entry = { id: `${Date.now()}-${Math.random()}`, label: primary.label, hand: primary.hand, ts: Date.now() };
            setHistory((prev) => [...prev.slice(-15), entry]);
            if (typeof onCapture === 'function') onCapture(primary.label);
          }
        } else {
          lastGestureRef.current = { label: key, stableCount: 1 };
        }
      } else {
        lastGestureRef.current = { label: null, stableCount: 0 };
      }
    } else {
      setDetectedHands(0);
      setCurrentGestures([]);
      lastGestureRef.current = { label: null, stableCount: 0 };
    }

    rafRef.current = requestAnimationFrame(detectLoop);
  }, [enabled, onCapture]);

  /* ---- Start / stop caméra ---- */
  const start = useCallback(async () => {
    setError('');
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setError('Webcam non supportée par ce navigateur');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      const lm = await ensureLandmarker();
      if (!lm) {
        setError('Modèle de suivi indisponible (réseau ?)');
      }
      setEnabled(true);
    } catch (err) {
      setError(err?.name === 'NotAllowedError' ? 'Caméra refusée — autorisez-la dans le navigateur.' : 'Erreur caméra');
      setEnabled(false);
    }
  }, [ensureLandmarker]);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    const s = streamRef.current;
    if (s) {
      try { s.getTracks().forEach((t) => t.stop()); } catch { /* ignore */ }
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setEnabled(false);
    setDetectedHands(0);
    setCurrentGestures([]);
  }, []);

  useEffect(() => {
    if (autoStart) start();
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (enabled) {
      rafRef.current = requestAnimationFrame(detectLoop);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [enabled, detectLoop]);

  const sendButtonDisabled = history.length === 0;

  const compact = typeof maxMainHeight === 'number' && maxMainHeight > 0;

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {/* ===== Écran de capture (large, 16/9) ===== */}
      <div
        className="relative w-full overflow-hidden rounded-2xl border bg-[#0E1320]"
        style={{
          borderColor: '#3D8BF0',
          boxShadow: '0 0 0 1px rgba(61,139,240,0.18), 0 14px 36px rgba(61,139,240,0.18)',
          aspectRatio: aspect,
          ...(typeof maxMainHeight === 'number' && maxMainHeight > 0 ? { maxHeight: maxMainHeight } : {}),
        }}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          className="absolute inset-0 h-full w-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
        />
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 h-full w-full"
        />

        {/* HUD : grid + scanline */}
        {enabled ? (
          <>
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(61,139,240,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(61,139,240,0.16) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
                mixBlendMode: 'screen',
                opacity: 0.35,
              }}
            />
            <motion.div
              className="pointer-events-none absolute inset-x-0 h-[2px]"
              style={{ background: 'linear-gradient(90deg, transparent, #3D8BF0, transparent)' }}
              animate={{ y: ['0%', '100%', '0%'] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <CornerBracket pos="tl" />
            <CornerBracket pos="tr" />
            <CornerBracket pos="bl" />
            <CornerBracket pos="br" />
          </>
        ) : (
          <div className="absolute inset-0 grid place-items-center text-center text-sm" style={{ color: '#A0ABBD', fontFamily: "'Open Sans', sans-serif" }}>
            <div>
              <Hand className="mx-auto h-8 w-8" style={{ color: '#3D8BF0' }} />
              <div className="mt-2 max-w-[260px]">
                {error || 'Activez la caméra pour démarrer le suivi de vos mains.'}
              </div>
            </div>
          </div>
        )}

        {/* Top bar */}
        <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider"
          style={{ background: 'rgba(61,139,240,0.85)', color: 'white', fontFamily: "'JetBrains Mono', monospace" }}
        >
          <ScanLine className="h-3 w-3" /> Suivi des mains
        </div>
        <div className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-semibold"
          style={{ background: 'rgba(14,19,32,0.75)', fontFamily: "'JetBrains Mono', monospace" }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{
            background: enabled ? '#3D8BF0' : '#D55C60',
            boxShadow: enabled ? '0 0 8px #3D8BF0' : 'none',
          }} />
          <span style={{ color: enabled ? '#3D8BF0' : '#D55C60' }}>
            {enabled ? `LIVE · ${detectedHands} main${detectedHands > 1 ? 's' : ''}` : 'OFF'}
          </span>
        </div>

        {/* Status pill (model loading) */}
        {modelStatus === 'loading' ? (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl px-4 py-3 text-sm font-semibold text-white"
            style={{ background: 'rgba(14,19,32,0.85)', fontFamily: "'Open Sans', sans-serif" }}
          >
            <div className="inline-flex items-center gap-2">
              <motion.span className="h-3 w-3 rounded-full" style={{ background: '#3D8BF0' }}
                animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity }} />
              Chargement du modèle de suivi…
            </div>
          </div>
        ) : null}
        {modelStatus === 'error' ? (
          <div className="absolute left-3 right-3 bottom-12 rounded-lg px-3 py-2 text-xs font-semibold"
            style={{ background: 'rgba(213,92,96,0.18)', color: '#D55C60', fontFamily: "'Open Sans', sans-serif" }}
          >
            Modèle indisponible — vérifiez votre connexion. La caméra fonctionne mais sans détection automatique.
          </div>
        ) : null}

        {/* Bottom toolbar */}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 border-t px-3 py-2"
          style={{ borderColor: 'rgba(61,139,240,0.20)', background: 'linear-gradient(180deg, transparent, rgba(14,19,32,0.85))' }}
        >
          <div className="text-[11px]" style={{ color: '#A0ABBD', fontFamily: "'JetBrains Mono', monospace" }}>
            {enabled
              ? `${fps} FPS · ${detectedHands ? 'mains détectées' : 'placez vos mains devant la caméra'}`
              : 'Caméra désactivée'}
          </div>
          <button
            type="button"
            onClick={() => (enabled ? stop() : start())}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition"
            style={{
              background: enabled ? 'rgba(213,92,96,0.18)' : '#3D8BF0',
              color: enabled ? '#D55C60' : 'white',
              fontFamily: "'Open Sans', sans-serif",
            }}
          >
            {enabled ? (
              <>
                <CameraOff className="h-3.5 w-3.5" />
                Couper
              </>
            ) : (
              <>
                <Camera className="h-3.5 w-3.5" />
                Activer
              </>
            )}
          </button>
        </div>
      </div>

      {/* ===== Panneau d'analyse (juste en dessous) ===== */}
      <div className={`rounded-2xl border bg-white ${compact ? 'p-2' : 'p-4'}`} style={{ borderColor: '#DDE5EF', boxShadow: '0 4px 12px rgba(31,45,74,0.05)' }}>
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-[#1F2D4A]" style={{ fontFamily: "'Open Sans', sans-serif" }}>
            Vos signes analysés
          </div>
          <span className="text-[10px] uppercase tracking-wider" style={{ color: '#607089', fontFamily: "'JetBrains Mono', monospace" }}>
            {history.length} mot{history.length > 1 ? 's' : ''}
          </span>
        </div>

        {/* En direct */}
        <div className={compact ? 'mt-2 min-h-[28px]' : 'mt-3 min-h-[36px]'}>
          {currentGestures.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              {currentGestures.map((g, i) => (
                <motion.span
                  // eslint-disable-next-line react/no-array-index-key
                  key={`${g.hand}-${g.label}-${i}`}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] font-semibold"
                  style={{
                    borderColor: '#3D8BF0',
                    background: '#E6F0FB',
                    color: '#1F5FBE',
                    fontFamily: "'Open Sans', sans-serif",
                  }}
                >
                  <span className="text-[10px] opacity-70">{g.hand === 'Left' ? 'GAUCHE' : 'DROITE'}</span>
                  {g.label}
                  {GESTURE_HINT_FR[g.label] ? (
                    <span className="font-normal opacity-80"> · {GESTURE_HINT_FR[g.label]}</span>
                  ) : null}
                </motion.span>
              ))}
            </div>
          ) : (
            <div className="text-[12px]" style={{ color: '#A0ABBD', fontFamily: "'Open Sans', sans-serif" }}>
              {enabled
                ? 'En attente d\'un geste — placez votre main bien dans le cadre.'
                : 'Démarrez la caméra pour commencer.'}
            </div>
          )}
        </div>

        {/* Historique */}
        {history.length > 0 ? (
          <>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {history.map((h) => (
                <span
                  key={h.id}
                  className="rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wider"
                  style={{ borderColor: '#DDE5EF', background: '#F4F7FB', color: '#3D8BF0', fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {h.label}
                  {GESTURE_HINT_FR[h.label] ? ` → ${GESTURE_HINT_FR[h.label]}` : ''}
                </span>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setHistory([])}
                className="rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition hover:bg-[#F4F7FB]"
                style={{ borderColor: '#DDE5EF', color: '#607089', fontFamily: "'Open Sans', sans-serif" }}
              >
                Effacer
              </button>
              <button
                type="button"
                disabled={sendButtonDisabled}
                onClick={() => {
                  const text = history.map((h) => h.label.toLowerCase()).join(' ');
                  if (!text || typeof window === 'undefined') return;
                  // dispatch a window event so the parent layout can wire it to chat
                  window.dispatchEvent(new CustomEvent('mymine:gesture-send', { detail: { text, history } }));
                  setHistory([]);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white transition disabled:opacity-50"
                style={{
                  background: '#3D8BF0',
                  fontFamily: "'Open Sans', sans-serif",
                  boxShadow: '0 6px 16px rgba(61,139,240,0.30)',
                }}
              >
                Envoyer à la réunion →
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function CornerBracket({ pos }) {
  const color = '#3D8BF0';
  const base = 'pointer-events-none absolute h-4 w-4';
  if (pos === 'tl') return <div className={`${base} left-2 top-2`} style={{ borderTop: `3px solid ${color}`, borderLeft: `3px solid ${color}`, borderTopLeftRadius: 4 }} />;
  if (pos === 'tr') return <div className={`${base} right-2 top-2`} style={{ borderTop: `3px solid ${color}`, borderRight: `3px solid ${color}`, borderTopRightRadius: 4 }} />;
  if (pos === 'bl') return <div className={`${base} left-2 bottom-12`} style={{ borderBottom: `3px solid ${color}`, borderLeft: `3px solid ${color}`, borderBottomLeftRadius: 4 }} />;
  if (pos === 'br') return <div className={`${base} right-2 bottom-12`} style={{ borderBottom: `3px solid ${color}`, borderRight: `3px solid ${color}`, borderBottomRightRadius: 4 }} />;
  return null;
}
