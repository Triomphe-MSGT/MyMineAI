import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

/**
 * StickFigureSigner — Bonhomme bâton « LSF »
 *
 * Vue PORTRAIT (épaules → tête → mains). Pas de jambes.
 * Tête grande et lisible :
 *   • yeux ovales (1.8 → 3.5)
 *   • sourcils indépendants animés
 *   • bouche qui morphe entre 6 expressions
 * Mains XL :
 *   • paume rectangle ~22×26
 *   • 5 doigts pleinement articulés (longueur 18px)
 *   • 9 configurations : open/flat/fist/point/peace/three/ok/pinch/rock
 *
 * Props :
 *   - gloses : string   ("ALICE MONTRER GRAPHIQUE VENTES …")
 *   - active : boolean  (false => idle, true => signe)
 *   - size   : number   (largeur en px, défaut 260)
 *   - accent : string   (couleur du trait, défaut bleu MyMine)
 *   - showCaption : boolean
 */

const HANDS = {
  open:   { fingers: [1, 1, 1, 1, 1], spread: 1 },
  flat:   { fingers: [1, 1, 1, 1, 1], spread: 0.25 },
  fist:   { fingers: [0, 0, 0, 0, 0], spread: 0 },
  point:  { fingers: [0, 1, 0, 0, 0], spread: 0.4 },
  peace:  { fingers: [0, 1, 1, 0, 0], spread: 0.85 },
  three:  { fingers: [1, 1, 1, 0, 0], spread: 0.7 },
  ok:     { fingers: [1, 1, 1, 1, 1], spread: 1, ok: true },
  pinch:  { fingers: [1, 1, 0, 0, 0], spread: 0.25, pinch: true },
  rock:   { fingers: [0, 1, 0, 0, 1], spread: 0.95 },
};

const FACES = {
  // mouth path (parenté à un centre fictif), brow tilt (deg), eye height ry
  neutral:   { mouth: 'M -10 8 Q 0 10 10 8',                         brow: 0,   eye: 3.0, mouthFill: false },
  smile:     { mouth: 'M -12 6 Q 0 18 12 6',                          brow: -3,  eye: 2.6, mouthFill: false },
  speak:     { mouth: 'M -9 6 Q 0 18 9 6 Q 0 12 -9 6 Z',              brow: -2,  eye: 3.0, mouthFill: true },
  ask:       { mouth: 'M -9 11 Q 0 6 9 11',                           brow: -6,  eye: 3.4, mouthFill: false },
  surprised: { mouth: 'M -6 6 Q 0 20 6 6 Q 0 12 -6 6 Z',              brow: -7,  eye: 3.8, mouthFill: true },
  focus:     { mouth: 'M -9 9 L 9 9',                                 brow: 3,   eye: 2.4, mouthFill: false },
};

const POSES = [
  // 1 — repos, mains à plat devant le buste
  { lE: [-30, 40], lW: [-18, 80],  lH: 'flat',  lR: -20,
    rE: [30, 40],  rW: [18, 80],   rH: 'flat',  rR: 20,
    face: 'neutral' },

  // 2 — index pointé en l'air, main gauche au repos
  { lE: [-32, 32], lW: [-38, 70],  lH: 'flat',  lR: -10,
    rE: [18, -8],  rW: [50, -50],  rH: 'point', rR: -25,
    face: 'speak' },

  // 3 — paumes ouvertes présentées
  { lE: [-40, 8],  lW: [-62, -16], lH: 'open',  lR: 25,
    rE: [40, 8],   rW: [62, -16],  rH: 'open',  rR: -25,
    face: 'smile' },

  // 4 — deux mains près de la bouche
  { lE: [-26, 14], lW: [-14, -24], lH: 'flat',  lR: 70,
    rE: [26, 14],  rW: [14, -24],  rH: 'flat',  rR: -70,
    face: 'speak' },

  // 5 — main droite vers le haut (question)
  { lE: [-30, 42], lW: [-18, 78],  lH: 'flat',  lR: -10,
    rE: [24, -2],  rW: [44, -68],  rH: 'open',  rR: -20,
    face: 'ask' },

  // 6 — pincement à droite (préciser)
  { lE: [-34, 36], lW: [-22, 72],  lH: 'flat',  lR: -10,
    rE: [14, 24],  rW: [36, 0],    rH: 'pinch', rR: -30,
    face: 'focus' },

  // 7 — deux mains "V" (victoire)
  { lE: [-28, -8], lW: [-32, -48], lH: 'peace', lR: 10,
    rE: [28, -8],  rW: [32, -48],  rH: 'peace', rR: -10,
    face: 'smile' },

  // 8 — OK à droite
  { lE: [-32, 36], lW: [-24, 72],  lH: 'flat',  lR: -10,
    rE: [22, 10],  rW: [40, -24],  rH: 'ok',    rR: -10,
    face: 'smile' },

  // 9 — index pointé vers le bas (désigner)
  { lE: [-30, 34], lW: [-18, 70],  lH: 'flat',  lR: -10,
    rE: [18, 34],  rW: [36, 80],   rH: 'point', rR: 165,
    face: 'focus' },

  // 10 — surprise : deux mains ouvertes hautes
  { lE: [-30, 0],  lW: [-44, -42], lH: 'open',  lR: 25,
    rE: [30, 0],   rW: [44, -42],  rH: 'open',  rR: -25,
    face: 'surprised' },

  // 11 — flat droite à la tempe (réfléchir)
  { lE: [-30, 40], lW: [-20, 76],  lH: 'flat',  lR: -10,
    rE: [16, -2],  rW: [12, -44],  rH: 'flat',  rR: -85,
    face: 'ask' },

  // 12 — main gauche sur le cœur, droite au repos
  { lE: [-18, 22], lW: [-2, 38],   lH: 'flat',  lR: 80,
    rE: [30, 40],  rW: [18, 80],   rH: 'flat',  rR: 20,
    face: 'smile' },

  // 13 — poing levé droit (urgence)
  { lE: [-30, 40], lW: [-18, 80],  lH: 'flat',  lR: -10,
    rE: [22, -4],  rW: [36, -54],  rH: 'fist',  rR: -10,
    face: 'focus' },

  // 14 — rock 🤘 droite (festif)
  { lE: [-32, 28], lW: [-44, 50],  lH: 'flat',  lR: 0,
    rE: [22, 0],   rW: [44, -42],  rH: 'rock',  rR: -15,
    face: 'smile' },

  // 15–22 — poses supplémentaires (plus de variété pour la démo)
  { lE: [-36, 20], lW: [-52, -8], lH: 'three', lR: 15,
    rE: [36, 20],  rW: [52, -8],  rH: 'three', rR: -15,
    face: 'speak' },
  { lE: [-28, 6],  lW: [-48, -36], lH: 'open',  lR: 35,
    rE: [28, 6],   rW: [48, -36],  rH: 'open',  rR: -35,
    face: 'surprised' },
  { lE: [-34, 38], lW: [-20, 74],  lH: 'point', lR: -40,
    rE: [30, 38],  rW: [20, 74],   rH: 'flat',  rR: 10,
    face: 'ask' },
  { lE: [-20, -6], lW: [-36, -52], lH: 'peace', lR: 5,
    rE: [34, 36],  rW: [22, 76],   rH: 'fist',  rR: 12,
    face: 'focus' },
  { lE: [-32, 32], lW: [-46, 58],  lH: 'flat',  lR: 25,
    rE: [32, 32],  rW: [46, 58],   rH: 'flat',  rR: -25,
    face: 'neutral' },
  { lE: [-26, 18], lW: [-8, 44],   lH: 'pinch', lR: 55,
    rE: [26, 18],  rW: [8, 44],    rH: 'pinch', rR: -55,
    face: 'speak' },
  { lE: [-38, 10], lW: [-58, -30], lH: 'flat',  lR: 40,
    rE: [24, -12], rW: [50, -58],  rH: 'point', rR: -8,
    face: 'smile' },
  { lE: [-30, 44], lW: [-18, 82],  lH: 'open',  lR: -5,
    rE: [30, 44],  rW: [18, 82],   rH: 'open',  rR: 5,
    face: 'smile' },
];

function tokenize(gloses) {
  if (!gloses || typeof gloses !== 'string') return [];
  return gloses
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 24);
}

function poseFor(token, idx) {
  if (!token) return POSES[0];
  let h = 0;
  for (let i = 0; i < token.length; i += 1) h = (h * 31 + token.charCodeAt(i)) >>> 0;
  return POSES[(h + idx) % POSES.length];
}

/* ------------------------------------------------------------------ */
/* HAND — paume large + 5 doigts                                       */
/* ------------------------------------------------------------------ */
function Hand({ x, y, shape = 'open', color }) {
  const cfg = HANDS[shape] || HANDS.open;
  const [thumb, index, middle, ring, pinky] = cfg.fingers;
  const spread = cfg.spread ?? 1;

  const FL = 18;          // finger length (extended)
  const FL_CURL = 8;      // finger length (curled visible)
  const PALM_W = 22;
  const PALM_H = 26;

  // Finger geometry — angles fan out from palm top
  const fingerAngles = [
    -65 * spread - 18,         // thumb
    -32 * spread,              // index
    -8  * spread,              // middle
    16  * spread,              // ring
    40  * spread,              // pinky
  ];

  const fingers = [thumb, index, middle, ring, pinky].map((extended, i) => {
    const angle = fingerAngles[i];
    const a = (angle * Math.PI) / 180;
    const len = extended ? FL : FL_CURL;
    const fx = Math.sin(a) * len;
    const fy = -Math.cos(a) * len;
    return { fx, fy, extended };
  });

  const isOK = cfg.ok;
  const isPinch = cfg.pinch;

  return (
    <g transform={`translate(${x},${y})`}>
      {/* palm filled lightly so the hand is reading clearly */}
      <rect
        x={-PALM_W / 2}
        y={0}
        width={PALM_W}
        height={PALM_H}
        rx={8}
        ry={8}
        fill={color}
        fillOpacity={0.10}
        stroke={color}
        strokeWidth={3}
      />
      {/* wrist line */}
      <line
        x1={-PALM_W / 2 + 3}
        y1={PALM_H + 1}
        x2={PALM_W / 2 - 3}
        y2={PALM_H + 1}
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      {/* palm crease (decorative) */}
      <path
        d={`M ${-PALM_W / 2 + 4} ${PALM_H * 0.55} Q 0 ${PALM_H * 0.7} ${PALM_W / 2 - 4} ${PALM_H * 0.55}`}
        fill="none"
        stroke={color}
        strokeOpacity={0.45}
        strokeWidth={1.4}
        strokeLinecap="round"
      />

      {/* fingers */}
      {fingers.map((f, i) => (
        <g key={i}>
          <line
            x1={0}
            y1={0}
            x2={f.fx}
            y2={f.fy}
            stroke={color}
            strokeWidth={f.extended ? 4.2 : 3.4}
            strokeLinecap="round"
          />
          {/* fingertip dot for emphasis */}
          <circle cx={f.fx} cy={f.fy} r={f.extended ? 2.2 : 1.6} fill={color} />
        </g>
      ))}

      {/* OK loop */}
      {isOK ? (
        <circle
          cx={(fingers[0].fx + fingers[1].fx) / 2}
          cy={(fingers[0].fy + fingers[1].fy) / 2}
          r={5}
          fill="none"
          stroke={color}
          strokeWidth={2.6}
        />
      ) : null}

      {/* Pinch tip */}
      {isPinch ? (
        <circle
          cx={(fingers[0].fx + fingers[1].fx) / 2}
          cy={(fingers[0].fy + fingers[1].fy) / 2}
          r={2.6}
          fill={color}
        />
      ) : null}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* MAIN COMPONENT                                                     */
/* ------------------------------------------------------------------ */
export function StickFigureSigner({
  gloses,
  active = true,
  size = 260,
  accent = '#3D8BF0',
  showCaption = true,
  /** Intervalle entre deux signes (gloses suivantes), en ms */
  signCycleMs = 720,
}) {
  const tokens = useMemo(() => tokenize(gloses), [gloses]);
  const [idx, setIdx] = useState(0);
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    setIdx(0);
  }, [gloses]);

  useEffect(() => {
    if (!active || tokens.length === 0) return undefined;
    const ms = Math.max(180, Number(signCycleMs) || 720);
    const id = setInterval(() => setIdx((i) => (i + 1) % tokens.length), ms);
    return () => clearInterval(id);
  }, [active, tokens, signCycleMs]);

  useEffect(() => {
    const id = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 140);
    }, 3200);
    return () => clearInterval(id);
  }, []);

  const pose = useMemo(() => {
    if (tokens.length === 0) return POSES[0];
    return poseFor(tokens[idx], idx);
  }, [tokens, idx]);

  const face = FACES[pose.face] || FACES.neutral;
  const transition = { duration: 0.5, ease: 'easeInOut' };

  // viewBox proportions optimisé pour gros visage + grandes mains
  // Head center y=-72 r=32 ; shoulders y=-4 ; hands typically y=20..80
  const W = 260;
  const H = 260;
  const halfW = W / 2;

  const SL = [-22, -2];
  const SR = [22, -2];

  return (
    <div className="relative inline-flex flex-col items-center" style={{ width: size }}>
      {/* halo */}
      <motion.div
        className="absolute inset-0 -z-10 rounded-full"
        style={{
          background: `radial-gradient(circle at 50% 35%, ${accent}22 0%, transparent 65%)`,
          filter: 'blur(12px)',
        }}
        animate={{ opacity: active ? [0.55, 0.95, 0.55] : 0.3 }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      />

      <svg
        viewBox={`${-halfW} ${-H * 0.55} ${W} ${H}`}
        width={size}
        height={size}
        className="block"
        aria-hidden
      >
        {/* HEAD */}
        <motion.g
          animate={{ rotate: active ? [-1.5, 1.5, -1.5] : 0, y: active ? [-1, 1, -1] : 0 }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ originX: 0, originY: -72 }}
        >
          {/* head circle bigger and lightly filled */}
          <circle cx={0} cy={-72} r={32} fill="white" stroke={accent} strokeWidth={3.4} />
          {/* a subtle filled inside for contrast on white bg */}
          <circle cx={0} cy={-72} r={32} fill={accent} fillOpacity={0.05} stroke="none" />

          {/* eyebrows */}
          <motion.line
            x1={-12} y1={-87} x2={-2} y2={-89}
            stroke={accent} strokeWidth={3.4} strokeLinecap="round"
            animate={{ y1: -87 + face.brow * 0.25, y2: -89 + face.brow * 0.25, rotate: face.brow }}
            transition={transition}
          />
          <motion.line
            x1={2} y1={-89} x2={12} y2={-87}
            stroke={accent} strokeWidth={3.4} strokeLinecap="round"
            animate={{ y1: -89 + face.brow * 0.25, y2: -87 + face.brow * 0.25, rotate: -face.brow }}
            transition={transition}
          />

          {/* eyes — large ovals */}
          <motion.ellipse
            cx={-10} cy={-76}
            rx={3.4}
            animate={{ ry: blink ? 0.4 : face.eye }}
            transition={{ duration: 0.1 }}
            fill={accent}
          />
          <motion.ellipse
            cx={10} cy={-76}
            rx={3.4}
            animate={{ ry: blink ? 0.4 : face.eye }}
            transition={{ duration: 0.1 }}
            fill={accent}
          />

          {/* eye highlights (réfléchit la lumière, vivant) */}
          <circle cx={-11} cy={-78} r={0.9} fill="white" />
          <circle cx={9} cy={-78} r={0.9} fill="white" />

          {/* mouth — bigger and clearly visible */}
          <motion.path
            d={face.mouth}
            transform="translate(0, -58)"
            fill={face.mouthFill ? accent : 'none'}
            fillOpacity={face.mouthFill ? 0.35 : 0}
            stroke={accent}
            strokeWidth={3.2}
            strokeLinecap="round"
            initial={false}
            animate={{ d: face.mouth }}
            transition={transition}
          />
        </motion.g>

        {/* NECK */}
        <line x1={0} y1={-40} x2={0} y2={-10} stroke={accent} strokeWidth={3.6} strokeLinecap="round" />

        {/* SHOULDERS */}
        <line x1={SL[0]} y1={SL[1]} x2={SR[0]} y2={SR[1]} stroke={accent} strokeWidth={3.8} strokeLinecap="round" />

        {/* TORSO suggestion : un V doux pour donner du corps */}
        <path
          d={`M ${SL[0]} ${SL[1] + 4} L -14 ${H * 0.36} M ${SR[0]} ${SR[1] + 4} L 14 ${H * 0.36}`}
          fill="none"
          stroke={accent}
          strokeOpacity={0.7}
          strokeWidth={3}
          strokeLinecap="round"
        />

        {/* LEFT ARM */}
        <Arm
          shoulder={SL}
          elbow={pose.lE}
          wrist={pose.lW}
          handShape={pose.lH}
          handRot={pose.lR}
          color={accent}
          transition={transition}
        />

        {/* RIGHT ARM */}
        <Arm
          shoulder={SR}
          elbow={pose.rE}
          wrist={pose.rW}
          handShape={pose.rH}
          handRot={pose.rR}
          color={accent}
          transition={transition}
        />
      </svg>

      {/* token caption */}
      {showCaption && tokens.length > 0 ? (
        <motion.span
          key={tokens[idx] + idx}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="-mt-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wider"
          style={{
            borderColor: '#DDE5EF',
            background: '#F4F7FB',
            color: accent,
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          }}
        >
          {tokens[idx]}
        </motion.span>
      ) : null}
    </div>
  );
}

function Arm({ shoulder, elbow, wrist, handShape, handRot, color, transition }) {
  const [sx, sy] = shoulder;
  return (
    <>
      {/* upper arm */}
      <motion.line
        x1={sx}
        y1={sy}
        animate={{ x2: elbow[0], y2: elbow[1] }}
        transition={transition}
        stroke={color}
        strokeWidth={3.6}
        strokeLinecap="round"
      />
      {/* forearm */}
      <motion.line
        animate={{ x1: elbow[0], y1: elbow[1], x2: wrist[0], y2: wrist[1] }}
        transition={transition}
        stroke={color}
        strokeWidth={3.6}
        strokeLinecap="round"
      />
      {/* hand — animate translation then rotation around wrist */}
      <motion.g
        initial={false}
        animate={{ x: wrist[0], y: wrist[1] }}
        transition={transition}
      >
        <motion.g
          initial={false}
          animate={{ rotate: handRot }}
          transition={transition}
          style={{ originX: '0px', originY: '0px' }}
        >
          <Hand x={0} y={0} shape={handShape} color={color} />
        </motion.g>
      </motion.g>
    </>
  );
}
