import { motion } from 'framer-motion';
import { ArrowRight, EarOff, EyeOff, Hash, RefreshCw, Users, Video } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const COLORS = {
  bg: '#F4F7FB',
  bgSoft: '#EBF1F9',
  surface: '#FFFFFF',
  surfaceAlt: '#EBF1F9',
  border: '#DDE5EF',
  borderStrong: '#C2CFE0',
  text: '#1F2D4A',
  textSoft: '#607089',
  textMuted: '#A0ABBD',
  blue: '#3D8BF0',
  blueHover: '#2E76D8',
  blueSoft: '#E6F0FB',
  blueDeep: '#1F5FBE',
  cyan: '#3D8BF0',
  violet: '#3D8BF0',
  amber: '#3D8BF0',
};

const FONT_TITLE = "'Open Sans', system-ui, sans-serif";
const FONT_BODY = "'Open Sans', system-ui, sans-serif";
const FONT_MONO = "'JetBrains Mono', ui-monospace, monospace";

const PROFILES = [
  {
    id: 'standard',
    label: 'Standard',
    sub: 'Vidéo + audio + chat',
    Icon: Users,
    accent: COLORS.cyan,
  },
  {
    id: 'blind',
    label: 'Aveugle',
    sub: 'Tout passe par la voix',
    Icon: EyeOff,
    accent: COLORS.violet,
  },
  {
    id: 'deaf',
    label: 'Sourd · Muet',
    sub: 'Sous-titres + LSF',
    Icon: EarOff,
    accent: COLORS.amber,
  },
];

function shortId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().slice(0, 8);
  }
  return Math.random().toString(36).slice(2, 10);
}

function generateRoomId() {
  return `mm-${shortId()}-${shortId()}`;
}

export function ProfileSelectPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialRoomId = useMemo(() => generateRoomId(), []);

  const [name, setName] = useState('');
  const [profile, setProfile] = useState('standard');
  const [roomId, setRoomId] = useState(initialRoomId);

  useEffect(() => {
    const preset = location.state?.presetProfile;
    if (preset && PROFILES.some((p) => p.id === preset)) setProfile(preset);
  }, [location.state]);

  const canJoin = name.trim().length > 0 && roomId.trim().length > 0;
  const activeProfile = PROFILES.find((p) => p.id === profile) || PROFILES[0];

  return (
    <div className="relative min-h-screen w-full" style={{ background: COLORS.bg, color: COLORS.text }}>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(600px 320px at 20% 10%, rgba(61,139,240,0.10), transparent 60%), radial-gradient(700px 360px at 80% 90%, rgba(61,139,240,0.14), transparent 65%)',
        }}
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8">
        <header className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src="/mymine-logo.svg"
              alt="MyMine AI"
              className="h-9 w-9"
              style={{ filter: 'drop-shadow(0 0 10px rgba(61,139,240,0.4))' }}
            />
            <span className="text-xl font-extrabold" style={{ fontFamily: FONT_TITLE }}>
              MyMine <span style={{ color: COLORS.blue }}>AI</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/demo-video" className="text-sm font-semibold" style={{ color: COLORS.blue, fontFamily: FONT_BODY }}>
              Démo vidéo (3 interfaces)
            </Link>
            <Link to="/" className="text-sm" style={{ color: COLORS.textSoft, fontFamily: FONT_BODY }}>
              ← Accueil
            </Link>
          </div>
        </header>

        <div className="mx-auto mt-10 grid w-full max-w-5xl grid-cols-1 items-start gap-8 lg:mt-16 lg:grid-cols-[1.05fr_1fr]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          >
            <div
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
              style={{ borderColor: COLORS.border, color: COLORS.text, fontFamily: FONT_BODY }}
            >
              <Video className="h-3.5 w-3.5" style={{ color: COLORS.cyan }} />
              Démarrer ou rejoindre une réunion
            </div>

            <h1
              className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl"
              style={{ color: COLORS.text, fontFamily: FONT_TITLE }}
            >
              Bonjour,
              <br /> <span style={{ color: COLORS.cyan }}>comment souhaitez-vous</span>
              <br /> participer aujourd'hui ?
            </h1>
            <p className="mt-4 max-w-md text-base" style={{ color: COLORS.textSoft, fontFamily: FONT_BODY }}>
              Choisissez ce qui vous va le mieux. Vous pouvez en changer à tout moment pendant la
              réunion, sans la quitter.
            </p>

            <div className="mt-8 flex items-center gap-4 text-xs" style={{ color: COLORS.textMuted, fontFamily: FONT_BODY }}>
              <span>Aucune installation</span>
              <span>·</span>
              <span>Aucun enregistrement</span>
              <span>·</span>
              <span>Fonctionne sur téléphone</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut', delay: 0.05 }}
            className="relative rounded-3xl border p-6 md:p-8"
            style={{
              borderColor: COLORS.border,
              background: COLORS.surface,
              boxShadow: '0 24px 60px rgba(11,31,58,0.10), 0 0 30px rgba(61,139,240,0.10)',
            }}
          >
            <div className="text-sm font-semibold" style={{ color: COLORS.textSoft, fontFamily: FONT_BODY }}>
              ÉTAPE 1
            </div>
            <label
              className="mt-1 block text-base font-semibold"
              style={{ color: COLORS.text, fontFamily: FONT_TITLE }}
            >
              Votre nom
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alice Dupont"
              className="mt-2 w-full rounded-2xl border px-4 py-3 text-base outline-none transition focus:border-[#3D8BF0]"
              style={{
                borderColor: COLORS.border,
                background: COLORS.surfaceAlt,
                color: COLORS.text,
                fontFamily: FONT_BODY,
              }}
              autoComplete="name"
            />

            <div className="mt-6 text-sm font-semibold" style={{ color: COLORS.textSoft, fontFamily: FONT_BODY }}>
              ÉTAPE 2
            </div>
            <div className="mt-1 text-base font-semibold" style={{ color: COLORS.text, fontFamily: FONT_TITLE }}>
              Votre profil d’accessibilité
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {PROFILES.map((p) => {
                const active = profile === p.id;
                const { Icon } = p;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProfile(p.id)}
                    className="group rounded-2xl border p-3 text-left transition"
                    style={{
                      borderColor: active ? p.accent : COLORS.border,
                      background: active ? COLORS.blueSoft : COLORS.surface,
                      boxShadow: active ? `0 0 24px ${p.accent}26` : 'none',
                    }}
                  >
                    <div
                      className="grid h-9 w-9 place-items-center rounded-xl border"
                      style={{ borderColor: COLORS.border, background: COLORS.surface }}
                    >
                      <Icon className="h-4 w-4" style={{ color: active ? p.accent : COLORS.text }} />
                    </div>
                    <div className="mt-2 text-sm font-semibold" style={{ color: COLORS.text, fontFamily: FONT_BODY }}>
                      {p.label}
                    </div>
                    <div className="text-xs" style={{ color: COLORS.textSoft, fontFamily: FONT_BODY }}>
                      {p.sub}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 text-sm font-semibold" style={{ color: COLORS.textSoft, fontFamily: FONT_BODY }}>
              ÉTAPE 3
            </div>
            <div className="mt-1 text-base font-semibold" style={{ color: COLORS.text, fontFamily: FONT_TITLE }}>
              ID de room
            </div>
            <div className="mt-2 flex gap-2">
              <div
                className="flex flex-1 items-center gap-2 rounded-2xl border px-4 py-3 transition focus-within:border-[#3D8BF0]"
                style={{ borderColor: COLORS.border, background: COLORS.surfaceAlt }}
              >
                <Hash className="h-4 w-4" style={{ color: COLORS.textSoft }} />
                <input
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="ex: mm-xxxxxxxx"
                  className="w-full bg-transparent text-sm outline-none"
                  style={{ color: COLORS.text, fontFamily: FONT_MONO }}
                  autoComplete="off"
                />
              </div>
              <button
                type="button"
                onClick={() => setRoomId(generateRoomId())}
                className="inline-flex items-center justify-center rounded-2xl border px-4 transition hover:border-[#3D8BF0]"
                style={{ borderColor: COLORS.border, background: COLORS.surfaceAlt }}
                aria-label="Générer un nouvel ID de room"
              >
                <RefreshCw className="h-4 w-4" style={{ color: COLORS.text }} />
              </button>
            </div>
            <p className="mt-2 text-xs" style={{ color: COLORS.textMuted, fontFamily: FONT_BODY }}>
              Partagez cet ID à vos invités pour qu’ils vous rejoignent.
            </p>

            <motion.button
              type="button"
              disabled={!canJoin}
              whileTap={canJoin ? { scale: 0.99 } : undefined}
              onClick={() => {
                if (!canJoin) return;
                navigate('/meeting', {
                  state: {
                    name: name.trim(),
                    profile,
                    roomId: roomId.trim(),
                  },
                });
              }}
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-bold transition"
              style={{
                background: canJoin ? COLORS.blue : COLORS.surfaceAlt,
                color: canJoin ? '#FFFFFF' : COLORS.textSoft,
                cursor: canJoin ? 'pointer' : 'not-allowed',
                boxShadow: canJoin ? '0 12px 28px rgba(61,139,240,0.40)' : 'none',
                fontFamily: FONT_BODY,
              }}
            >
              {canJoin ? `Rejoindre en mode ${activeProfile.label}` : 'Indiquez votre nom pour continuer'}
              <ArrowRight className="h-4 w-4" />
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
