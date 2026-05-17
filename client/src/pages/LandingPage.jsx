import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Accessibility,
  ArrowRight,
  Brain,
  CalendarPlus,
  Captions,
  ChevronRight,
  Ear,
  EarOff,
  Eye,
  EyeOff,
  Hand,
  Languages,
  Laptop,
  MessageCircle,
  Mic,
  MicOff,
  MonitorPlay,
  PersonStanding,
  PhoneOff,
  PlayCircle,
  Radio,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
  Video,
  Volume2,
  Waves,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { StickFigureSigner } from '../components/deaf/StickFigureSigner.jsx';

const COLORS = {
  bg: '#F4F7FB',          /* fond de page : blanc cassé bleu-gris, doux pour les yeux */
  bgSoft: '#EBF1F9',      /* sections alternées un peu plus profondes */
  surface: '#FFFFFF',     /* cartes seulement (blanc pur, en petites doses) */
  surfaceAlt: '#EBF1F9',
  border: '#DDE5EF',
  borderStrong: '#C2CFE0',
  text: '#1F2D4A',        /* gris-bleu sombre, non agressif */
  textSoft: '#607089',
  textMuted: '#A0ABBD',
  blue: '#3D8BF0',
  blueHover: '#2E76D8',
  blueSoft: '#E6F0FB',
  blueDeep: '#1F5FBE',
  red: '#D55C60',
};

const FONT_TITLE = "'Open Sans', system-ui, sans-serif";
const FONT_BODY = "'Open Sans', system-ui, sans-serif";
const FONT_MONO = "'JetBrains Mono', ui-monospace, monospace";

/* -------------------------------------------------------------- */
/*  Background utilities                                          */
/* -------------------------------------------------------------- */

function LightDecorBg() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Grille subtile */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(61,139,240,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(61,139,240,0.06) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(circle at 50% 30%, black 0%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 30%, black 0%, transparent 75%)',
        }}
      />
      {/* Halo bleu doux */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0.7 }}
        animate={{ opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background:
            'radial-gradient(800px 380px at 18% 18%, rgba(61,139,240,0.12), transparent 60%), radial-gradient(900px 420px at 82% 28%, rgba(61,139,240,0.10), transparent 65%)',
        }}
      />
    </div>
  );
}

/* -------------------------------------------------------------- */
/*  Nav + announcement bar                                         */
/* -------------------------------------------------------------- */

function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <header
      className="sticky top-0 z-40 w-full border-b backdrop-blur"
      style={{ borderColor: COLORS.border, background: 'rgba(255,255,255,0.85)' }}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2.5" style={{ fontFamily: FONT_TITLE }}>
            <img
              src="/mymine-logo.svg"
              alt="MyMine"
              className="h-9 w-9 select-none"
              draggable={false}
              style={{ filter: 'drop-shadow(0 2px 10px rgba(61,139,240,0.35))' }}
            />
            <span className="text-xl font-extrabold tracking-tight" style={{ color: COLORS.text }}>
              MyMine
            </span>
          </Link>

        <nav
          className="hidden items-center gap-7 text-sm md:flex"
          style={{ color: COLORS.textSoft, fontFamily: FONT_BODY }}
        >
          <a href="#products" className="transition hover:text-[#1F2D4A]">Présentation</a>
          <a href="#interfaces" className="transition hover:text-[#1F2D4A]">Les 3 profils</a>
          <a href="#devices" className="transition hover:text-[#1F2D4A]">Mobile &amp; ordinateur</a>
          <a href="#workflow" className="transition hover:text-[#1F2D4A]">Comment ça marche</a>
          <a href="#stories" className="transition hover:text-[#1F2D4A]">Ils l'utilisent</a>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/demo-video"
            className="hidden items-center gap-1 rounded-xl border px-3 py-2 text-sm font-semibold transition hover:bg-[#E6F0FB] sm:inline-flex"
            style={{ borderColor: COLORS.blue, color: COLORS.blueDeep, fontFamily: FONT_BODY }}
          >
            <MonitorPlay className="h-4 w-4" aria-hidden />
            Voir la démo
          </Link>
          <Link
            to="/select"
            className="hidden items-center gap-1 rounded-xl border px-3 py-2 text-sm font-semibold transition hover:bg-[#F4F7FB] sm:inline-flex"
            style={{ borderColor: COLORS.border, color: COLORS.text, fontFamily: FONT_BODY }}
          >
            Rejoindre
          </Link>
          <Link
            to="/select"
            className="inline-flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-semibold text-white transition"
            style={{
              background: COLORS.blue,
              fontFamily: FONT_BODY,
              boxShadow: '0 8px 22px rgba(61,139,240,0.35)',
            }}
          >
            Démarrer
            <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            type="button"
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
            className="ml-1 inline-flex h-10 w-10 items-center justify-center rounded-xl border md:hidden"
            style={{ borderColor: COLORS.border, color: COLORS.text }}
          >
            <span className="block h-0.5 w-4 bg-current" />
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t md:hidden" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
          <div className="flex flex-col gap-3 px-6 py-4 text-sm" style={{ color: COLORS.textSoft, fontFamily: FONT_BODY }}>
            <Link
              to="/demo-video"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-2 font-semibold"
              style={{ color: COLORS.blueDeep, fontFamily: FONT_BODY }}
            >
              <MonitorPlay className="h-4 w-4 shrink-0" aria-hidden />
              Voir la démo
            </Link>
            <a href="#products" onClick={() => setOpen(false)}>Présentation</a>
            <a href="#interfaces" onClick={() => setOpen(false)}>Les 3 profils</a>
            <a href="#devices" onClick={() => setOpen(false)}>Mobile &amp; ordinateur</a>
            <a href="#workflow" onClick={() => setOpen(false)}>Comment ça marche</a>
            <a href="#stories" onClick={() => setOpen(false)}>Ils l'utilisent</a>
          </div>
        </div>
      ) : null}
    </header>
  );
}

function AnnouncementBar() {
  return (
    <div className="w-full border-b" style={{ borderColor: COLORS.border, background: COLORS.blueSoft }}>
      <div
        className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-3 px-6 py-2 text-[13px]"
        style={{ color: COLORS.text, fontFamily: FONT_BODY }}
      >
        <span className="inline-flex items-center gap-2">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: COLORS.blue, boxShadow: '0 0 10px rgba(61,139,240,0.7)' }}
          />
          <strong>Nouveau —</strong>
          La caméra peut désormais lire vos signes et les traduire pour les autres.
        </span>
        <Link to="/select" className="inline-flex items-center gap-1 underline-offset-4 hover:underline" style={{ color: COLORS.blueDeep }}>
          Essayer <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- */
/*  Hero + preview                                                 */
/* -------------------------------------------------------------- */

function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, -60]);

  return (
    <section ref={ref} className="relative w-full overflow-hidden" id="top">
      <LightDecorBg />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 pb-20 pt-14 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
        <motion.div style={{ y }} className="max-w-xl">
          <h1
            className="text-5xl font-extrabold leading-[1.05] tracking-tight md:text-6xl"
            style={{ color: COLORS.text, fontFamily: FONT_TITLE }}
          >
            Une visio
            <br />
            <span style={{ color: COLORS.blue }}>qui s'adapte</span>
            <br />
            à vos sens.
          </h1>

          <p className="mt-5 max-w-lg text-lg" style={{ color: COLORS.textSoft, fontFamily: FONT_BODY }}>
            Chaque participant voit la réunion à sa manière : voix et descriptions pour qui ne voit pas,
            sous-titres et langue des signes pour qui n'entend pas, vidéo classique pour les autres.
            Personne ne reste à la porte.
          </p>

          <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Link
              to="/select"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition"
              style={{
                background: COLORS.blue,
                boxShadow: '0 10px 28px rgba(61,139,240,0.40)',
                fontFamily: FONT_BODY,
              }}
            >
              <Video className="h-4 w-4" /> Démarrer une réunion
            </Link>
            <Link
              to="/select"
              className="inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition hover:bg-[#F4F7FB]"
              style={{ borderColor: COLORS.borderStrong, color: COLORS.text, fontFamily: FONT_BODY }}
            >
              <CalendarPlus className="h-4 w-4" /> Rejoindre une room
            </Link>
            <Link
              to="/demo-video"
              className="inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition hover:bg-[#E6F0FB]"
              style={{ borderColor: COLORS.blue, color: COLORS.blueDeep, fontFamily: FONT_BODY }}
            >
              <MonitorPlay className="h-4 w-4" aria-hidden /> Voir la démo
            </Link>
            <a
              href="#workflow"
              className="inline-flex items-center gap-1 text-sm transition hover:text-[#1F2D4A]"
              style={{ color: COLORS.blue, fontFamily: FONT_BODY }}
            >
              <PlayCircle className="h-4 w-4" /> Voir comment ça marche
            </a>
          </div>

        </motion.div>

        <HeroMockup />
      </div>
    </section>
  );
}

function HeroMockup() {
  const [tab, setTab] = useState('standard');
  useEffect(() => {
    const order = ['standard', 'blind', 'deaf'];
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % order.length;
      setTab(order[i]);
    }, 3800);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
      className="relative w-full"
    >
      <div
        className="relative overflow-hidden rounded-3xl border p-3"
        style={{
          borderColor: COLORS.border,
          background: COLORS.surface,
          boxShadow: '0 30px 80px rgba(61,139,240,0.14), 0 8px 24px rgba(11,31,58,0.08)',
        }}
      >
        {/* browser chrome */}
        <div className="mb-3 flex items-center justify-between px-2">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#FF5F57' }} />
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#FEBC2E' }} />
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#28C840' }} />
          </div>
          <div
            className="rounded-md border px-2 py-0.5 text-[10px]"
            style={{ borderColor: COLORS.border, color: COLORS.textSoft, fontFamily: FONT_MONO, background: COLORS.bgSoft }}
          >
            mymine.app/meeting/{tab}
          </div>
          <div className="inline-flex items-center gap-1 text-[10px]" style={{ color: COLORS.red, fontFamily: FONT_MONO }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: COLORS.red, boxShadow: '0 0 8px rgba(229,72,77,0.6)' }} />
            LIVE
          </div>
        </div>

        {/* tabs */}
        <div className="mb-3 flex items-center gap-2 px-1">
          {[
            { id: 'standard', label: 'Standard', Icon: Users },
            { id: 'blind', label: 'Aveugle', Icon: EyeOff },
            { id: 'deaf', label: 'Sourd·Muet', Icon: EarOff },
          ].map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] transition"
                style={{
                  borderColor: active ? COLORS.blue : COLORS.border,
                  background: active ? COLORS.blueSoft : COLORS.surface,
                  color: active ? COLORS.blueDeep : COLORS.textSoft,
                  fontFamily: FONT_BODY,
                }}
                type="button"
              >
                <t.Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="relative h-[360px] overflow-hidden rounded-2xl border" style={{ borderColor: COLORS.border, background: COLORS.bgSoft }}>
          {tab === 'standard' && <PreviewStandard />}
          {tab === 'blind' && <PreviewBlind />}
          {tab === 'deaf' && <PreviewDeaf />}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute -left-4 top-10 hidden rounded-xl border px-3 py-2 backdrop-blur lg:flex"
        style={{ borderColor: COLORS.border, background: 'rgba(255,255,255,0.9)', boxShadow: '0 10px 24px rgba(61,139,240,0.15)' }}
      >
        <div className="flex items-center gap-2 text-xs" style={{ color: COLORS.text, fontFamily: FONT_BODY }}>
          <Brain className="h-4 w-4" style={{ color: COLORS.blue }} />
          Reformulé en temps réel
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="absolute -right-3 bottom-8 hidden rounded-xl border px-3 py-2 backdrop-blur lg:flex"
        style={{ borderColor: COLORS.border, background: 'rgba(255,255,255,0.9)', boxShadow: '0 10px 24px rgba(61,139,240,0.15)' }}
      >
        <div className="flex items-center gap-2 text-xs" style={{ color: COLORS.text, fontFamily: FONT_BODY }}>
          <Captions className="h-4 w-4" style={{ color: COLORS.blue }} />
          Sous-titres temps réel
        </div>
      </motion.div>
    </motion.div>
  );
}

function PreviewStandard() {
  const tiles = ['Alice', 'Karim', 'Sofia', 'You'];
  return (
    <div className="grid h-full grid-cols-2 grid-rows-2 gap-2 p-2">
      {tiles.map((n, i) => (
        <div
          key={n}
          className="relative overflow-hidden rounded-xl border"
          style={{
            borderColor: i === 0 ? COLORS.blue : COLORS.border,
            background: `linear-gradient(135deg, ${COLORS.blueSoft}, ${COLORS.bgSoft})`,
            boxShadow: i === 0 ? '0 0 0 2px rgba(61,139,240,0.20)' : 'none',
          }}
        >
          <div
            className="absolute inset-x-0 bottom-0 flex items-center justify-between px-2 py-1.5 text-[11px]"
            style={{ color: COLORS.text, fontFamily: FONT_BODY, background: 'rgba(255,255,255,0.78)' }}
          >
            <span className="font-semibold">{n}</span>
            <span className="inline-flex items-center gap-1" style={{ color: i === 0 ? COLORS.blue : COLORS.textSoft }}>
              <Mic className="h-3 w-3" /> {i === 0 ? 'parle' : 'muet'}
            </span>
          </div>
          <div className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: COLORS.blue, fontFamily: FONT_MONO }}>
            {n[0]}
          </div>
        </div>
      ))}
    </div>
  );
}

function PreviewBlind() {
  return (
    <div className="grid h-full grid-cols-[180px_1fr] gap-3 p-3">
      <div className="space-y-2">
        <div className="rounded-xl border p-3" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
          <div className="text-[11px]" style={{ color: COLORS.textSoft, fontFamily: FONT_BODY }}>Participants</div>
          <div className="mt-2 space-y-1.5 text-[12px]" style={{ color: COLORS.text, fontFamily: FONT_BODY }}>
            {['Alice (parle)', 'Karim', 'Sofia'].map((n, i) => (
              <div key={n} className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: i === 0 ? COLORS.blue : COLORS.borderStrong }} />
                {n}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border p-3" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
          <div className="text-[11px]" style={{ color: COLORS.textSoft, fontFamily: FONT_BODY }}>Volume</div>
          <div className="mt-2 flex items-center gap-2 text-[11px]" style={{ color: COLORS.text, fontFamily: FONT_MONO }}>
            <Volume2 className="h-3.5 w-3.5" style={{ color: COLORS.blue }} /> 90 %
          </div>
        </div>
      </div>

      <div className="relative flex items-center justify-center rounded-xl border" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute h-40 w-40 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(61,139,240,0.30), transparent 70%)' }}
        />
        <div className="relative grid h-28 w-28 place-items-center rounded-3xl border text-white" style={{ borderColor: COLORS.blue, background: COLORS.blue, boxShadow: '0 0 30px rgba(61,139,240,0.45)' }}>
          <Mic className="h-12 w-12" />
        </div>
        <div className="absolute bottom-3 left-3 right-3 rounded-lg border p-2 text-[11px]" style={{ borderColor: COLORS.border, background: COLORS.bgSoft, color: COLORS.text, fontFamily: FONT_BODY }}>
          <span style={{ color: COLORS.textSoft }}>L'assistant :</span> Alice partage un graphique. Les ventes sont en hausse de 20 % au dernier trimestre.
        </div>
      </div>
    </div>
  );
}

function PreviewDeaf() {
  return (
    <div className="grid h-full grid-rows-[1fr_auto] gap-2 p-2">
      <div className="grid grid-cols-3 gap-2">
        {['Alice', 'Karim', 'You'].map((n, i) => (
          <div
            key={n}
            className="relative overflow-hidden rounded-xl border"
            style={{
              borderColor: i === 0 ? COLORS.blue : COLORS.border,
              background: `linear-gradient(135deg, ${COLORS.blueSoft}, ${COLORS.bgSoft})`,
            }}
          >
            <div className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: COLORS.blue, fontFamily: FONT_MONO }}>
              {n[0]}
            </div>
            <div className="absolute inset-x-0 bottom-0 px-2 py-1 text-[10px]" style={{ color: COLORS.text, fontFamily: FONT_BODY, background: 'rgba(255,255,255,0.78)' }}>
              {n}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_140px] gap-2">
        <div className="rounded-xl border p-3" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider" style={{ color: COLORS.textSoft, fontFamily: FONT_MONO }}>
            <Captions className="h-3 w-3" /> Sous-titres
          </div>
          <div className="mt-1.5 text-[13px] leading-snug" style={{ color: COLORS.text, fontFamily: FONT_BODY }}>
            <span style={{ color: COLORS.blue }}>Alice :</span> on ouvre le tableau des ventes —
            <motion.span animate={{ opacity: [0, 1] }} transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}> _</motion.span>
          </div>
          <div className="mt-1 text-[11px]" style={{ color: COLORS.textSoft, fontFamily: FONT_MONO }}>
            LSF: ALICE OUVRIR TABLEAU VENTES
          </div>
        </div>
        <div className="grid place-items-center rounded-xl border" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
          <StickFigureSigner gloses="ALICE OUVRIR TABLEAU" active size={110} accent={COLORS.blue} showCaption={false} />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- */
/*  Stats strip                                                    */
/* -------------------------------------------------------------- */

function StatsStrip() {
  const stats = [
    { value: 'Sans coupure',  label: 'Le son et la vidéo restent fluides',  Icon: Zap },
    { value: '3 façons',      label: 'D\'entrer dans la même réunion',       Icon: Accessibility },
    { value: 'Tout y est',    label: 'Voix, sous-titres, langue des signes', Icon: Captions },
    { value: 'En direct',     label: 'Aucun enregistrement n\'est conservé', Icon: ShieldCheck },
  ];
  return (
    <section className="relative border-y" style={{ borderColor: COLORS.border, background: COLORS.bgSoft }}>
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px md:grid-cols-4" style={{ background: COLORS.border }}>
        {stats.map(({ value, label, Icon }) => (
          <div key={label} className="flex items-center gap-3 px-6 py-5" style={{ background: COLORS.bgSoft }}>
            <div className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: COLORS.blueSoft, color: COLORS.blue }}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-bold" style={{ color: COLORS.text, fontFamily: FONT_TITLE }}>{value}</div>
              <div className="text-xs" style={{ color: COLORS.textSoft, fontFamily: FONT_BODY }}>{label}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- */
/*  AI Companion block                                             */
/* -------------------------------------------------------------- */

function AICompanionBlock() {
  return (
    <section className="relative py-24" id="products">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-[1fr_1.05fr]">
        <div>
          <div
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
            style={{ borderColor: COLORS.borderStrong, color: COLORS.blueDeep, fontFamily: FONT_BODY, background: COLORS.blueSoft }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            L'assistant MyMine
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight md:text-5xl" style={{ color: COLORS.text, fontFamily: FONT_TITLE }}>
            Il parle, il écrit,
            <br /> <span style={{ color: COLORS.blue }}>il signe.</span>
          </h2>
          <p className="mt-4 max-w-xl text-base md:text-lg" style={{ color: COLORS.textSoft, fontFamily: FONT_BODY }}>
            MyMine écoute la réunion, reformule en quelques mots ce qui vient d'être dit ou montré,
            puis le présente à chacun sous la forme qui lui convient.
          </p>

          <ul className="mt-8 space-y-4">
            {[
              { Icon: Ear, title: 'Transcrit la parole', desc: 'En français, en direct, avec le nom de qui parle.' },
              { Icon: Eye, title: 'Décrit ce qui est partagé à l\'écran', desc: 'Un graphique, une slide, une page web — résumé en une phrase claire.' },
              { Icon: Hand, title: 'Capte vos gestes', desc: 'Votre webcam suit vos mains : vos signes deviennent du texte pour les autres.' },
              { Icon: Radio, title: 'Adresse à chacun ce qui le concerne', desc: 'Pas de mur de notifications : on reçoit ce qui est utile, dans la forme qui va bien.' },
            ].map(({ Icon, title, desc }) => (
              <li key={title} className="flex items-start gap-3">
                <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: COLORS.blueSoft, color: COLORS.blue }}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: COLORS.text, fontFamily: FONT_BODY }}>{title}</div>
                  <div className="text-sm" style={{ color: COLORS.textSoft, fontFamily: FONT_BODY }}>{desc}</div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/select"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition"
              style={{ background: COLORS.blue, fontFamily: FONT_BODY, boxShadow: '0 10px 28px rgba(61,139,240,0.35)' }}
            >
              Essayer maintenant <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#workflow"
              className="inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition hover:bg-[#EBF1F9]"
              style={{ borderColor: COLORS.borderStrong, color: COLORS.text, fontFamily: FONT_BODY }}
            >
              Comment ça marche <ChevronRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        <CompanionDemo />
      </div>
    </section>
  );
}

function CompanionDemo() {
  const lines = [
    { from: 'Alice', text: "J'ouvre le graphique des ventes du T4.", role: 'standard' },
    { from: 'IA', text: 'Alice partage un graphique : ventes T4 +20 %, pic en décembre.', role: 'blind' },
    { from: 'Sous-titres', text: 'Alice → ouverture du tableau des ventes T4 (+20 %)', role: 'deaf' },
    { from: 'IA', text: 'Karim lève la main.', role: 'system' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="relative w-full overflow-hidden rounded-3xl border p-5"
      style={{ borderColor: COLORS.border, background: COLORS.surface, boxShadow: '0 24px 60px rgba(61,139,240,0.10)' }}
    >
      <div className="flex items-center gap-2 text-xs" style={{ color: COLORS.textSoft, fontFamily: FONT_MONO }}>
        <Waves className="h-3.5 w-3.5" style={{ color: COLORS.blue }} /> live · room a7f2-…
      </div>

      <div className="mt-4 space-y-2.5">
        {lines.map((l, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.12 }}
            className="rounded-xl border px-3 py-2.5"
            style={{
              borderColor: l.role === 'blind' || l.role === 'deaf' ? COLORS.blue : COLORS.border,
              background: l.role === 'blind' || l.role === 'deaf' ? COLORS.blueSoft : COLORS.bgSoft,
            }}
          >
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider" style={{ color: COLORS.textSoft, fontFamily: FONT_MONO }}>
              <span>{l.from}</span>
              <span style={{ color: COLORS.blueDeep }}>{l.role}</span>
            </div>
            <div className="mt-1 text-sm" style={{ color: COLORS.text, fontFamily: FONT_BODY }}>{l.text}</div>
          </motion.div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 text-[11px]" style={{ color: COLORS.text, fontFamily: FONT_BODY }}>
        {[
          { Icon: Volume2, label: 'TTS aveugle' },
          { Icon: Captions, label: 'Sous-titres' },
          { Icon: PersonStanding, label: 'Avatar LSF' },
        ].map(({ Icon, label }) => (
          <div key={label} className="rounded-lg border p-2 text-center" style={{ borderColor: COLORS.border, background: COLORS.bgSoft }}>
            <Icon className="mx-auto mb-1 h-4 w-4" style={{ color: COLORS.blue }} />
            {label}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------- */
/*  Devices Showcase — 3 phones (Deaf, Blind, Standard) + Desktop   */
/* -------------------------------------------------------------- */

const TILE_PHOTOS = [
  { name: 'Amina', src: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&auto=format&fit=crop&q=80', skin: 'linear-gradient(135deg, #8b5a3c, #c98a6a)' },
  { name: 'Marco', src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80', skin: 'linear-gradient(135deg, #e7c9a6, #c69a78)' },
  { name: 'Léa',   src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80', skin: 'linear-gradient(135deg, #f3d6c6, #d8a892)' },
  { name: 'Kenji', src: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&auto=format&fit=crop&q=80', skin: 'linear-gradient(135deg, #f0d5b6, #bf8e6e)' },
  { name: 'Zara',  src: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80', skin: 'linear-gradient(135deg, #6d4528, #a16a45)' },
  { name: 'Diego', src: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80', skin: 'linear-gradient(135deg, #c8a07a, #8b6644)' },
];

function PortraitTile({ name, src, skin, speaking = false, micOff = false, self = false, ring = false }) {
  const [errored, setErrored] = useState(false);
  const [loaded, setLoaded] = useState(false);
  return (
    <div
      className="relative overflow-hidden rounded-lg"
      style={{
        background: skin,
        outline: speaking || ring ? `2px solid ${COLORS.blue}` : `1px solid rgba(255,255,255,0.12)`,
        boxShadow: speaking ? '0 0 18px rgba(61,139,240,0.55)' : 'none',
      }}
    >
      {!errored ? (
        <img
          src={src}
          alt={name}
          loading="lazy"
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className="h-full w-full object-cover"
          style={{ opacity: loaded ? 1 : 0, transition: 'opacity .3s ease' }}
        />
      ) : null}
      {errored || !loaded ? (
        <div className="absolute inset-0 grid place-items-center">
          <div className="grid h-9 w-9 place-items-center rounded-full text-sm font-bold text-white" style={{ background: 'rgba(0,0,0,0.35)', fontFamily: FONT_TITLE }}>
            {name[0]}
          </div>
        </div>
      ) : null}

      <div
        className="absolute bottom-0.5 left-0.5 right-0.5 flex items-center justify-between rounded px-1 py-0.5 text-[9px] font-semibold text-white"
        style={{ background: 'rgba(0,0,0,0.55)', fontFamily: FONT_BODY }}
      >
        <span className="truncate">{self ? `${name} (vous)` : name}</span>
        {micOff ? <MicOff className="h-2.5 w-2.5 text-[#D55C60]" /> : <Mic className="h-2.5 w-2.5" style={{ color: COLORS.blue }} />}
      </div>

      {speaking ? (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-lg"
          animate={{ boxShadow: ['0 0 0 0 rgba(61,139,240,0.55)', '0 0 0 6px rgba(61,139,240,0)'] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        />
      ) : null}
    </div>
  );
}

function PhoneFrame({ children, label }) {
  return (
    <div className="relative">
      {label ? (
        <div
          className="absolute -top-3 left-1/2 z-20 -translate-x-1/2 rounded-full border px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
          style={{ borderColor: COLORS.blue, background: 'white', color: COLORS.blueDeep, fontFamily: FONT_MONO, boxShadow: '0 4px 14px rgba(61,139,240,0.25)' }}
        >
          {label}
        </div>
      ) : null}
      <div
        className="relative overflow-hidden rounded-[40px] border p-2"
        style={{
          borderColor: '#222',
          background: '#111',
          boxShadow: '0 30px 60px rgba(11,31,58,0.22), 0 8px 24px rgba(61,139,240,0.10)',
          width: 270,
        }}
      >
        {/* dynamic island */}
        <div className="absolute left-1/2 top-2 z-10 h-5 w-20 -translate-x-1/2 rounded-full" style={{ background: '#000' }}>
          <div className="absolute right-3 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full" style={{ background: COLORS.blue }} />
        </div>
        <div className="relative h-[540px] overflow-hidden rounded-[32px]" style={{ background: '#0E1320' }}>
          {children}
        </div>
        {/* buttons */}
        <div className="absolute -left-[3px] top-24 h-7 w-[3px] rounded-l" style={{ background: '#1f1f1f' }} />
        <div className="absolute -left-[3px] top-36 h-10 w-[3px] rounded-l" style={{ background: '#1f1f1f' }} />
        <div className="absolute -left-[3px] top-52 h-10 w-[3px] rounded-l" style={{ background: '#1f1f1f' }} />
        <div className="absolute -right-[3px] top-32 h-14 w-[3px] rounded-r" style={{ background: '#1f1f1f' }} />
      </div>
    </div>
  );
}

function PhoneTopBar({ title, subtitle, accent = COLORS.blue }) {
  return (
    <div className="flex items-center justify-between border-b px-3 pb-2 pt-3" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
      <div className="flex items-center gap-2">
        <img src="/mymine-logo.svg" alt="" className="h-5 w-5" />
        <div>
          <div className="text-[11px] font-bold text-white" style={{ fontFamily: FONT_BODY }}>{title}</div>
          <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: FONT_MONO }}>{subtitle}</div>
        </div>
      </div>
      <div className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold" style={{ background: `${accent}20`, color: accent, fontFamily: FONT_MONO }}>
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
        LIVE
      </div>
    </div>
  );
}

function PhoneControls() {
  return (
    <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-2">
      {[
        { Icon: Mic, bg: 'rgba(255,255,255,0.10)', color: 'white' },
        { Icon: Video, bg: 'rgba(255,255,255,0.10)', color: 'white' },
        { Icon: MessageCircle, bg: 'rgba(255,255,255,0.10)', color: 'white' },
        { Icon: PhoneOff, bg: COLORS.red, color: 'white' },
      ].map(({ Icon, bg, color }, i) => (
        <div
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          className="grid h-9 w-9 place-items-center rounded-full"
          style={{ background: bg, color }}
        >
          <Icon className="h-4 w-4" />
        </div>
      ))}
    </div>
  );
}

function DeafPhoneScreen() {
  return (
    <>
      <PhoneTopBar title="Sourd · Muet" subtitle="LSF + capture gestes" />
      {/* presenter screen share */}
      <div className="mx-2 mt-2 overflow-hidden rounded-lg border" style={{ borderColor: 'rgba(255,255,255,0.10)' }}>
        <div
          className="grid h-24 w-full place-items-center text-white"
          style={{
            background:
              'linear-gradient(135deg, rgba(61,139,240,0.85), rgba(11,91,211,0.95)), repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0 10px, transparent 10px 20px)',
          }}
        >
          <div className="text-center">
            <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.75)', fontFamily: FONT_MONO }}>Partage d'écran · Alice</div>
            <div className="mt-0.5 text-[14px] font-extrabold" style={{ fontFamily: FONT_TITLE }}>Ventes T4 +20%</div>
            <div className="mt-1 text-[9px]" style={{ color: 'rgba(255,255,255,0.75)', fontFamily: FONT_BODY }}>Pic en décembre</div>
          </div>
        </div>
      </div>

      {/* participants */}
      <div className="mx-2 mt-2 grid grid-cols-3 gap-1.5" style={{ height: 56 }}>
        <PortraitTile {...TILE_PHOTOS[0]} speaking />
        <PortraitTile {...TILE_PHOTOS[1]} />
        <PortraitTile {...TILE_PHOTOS[5]} self micOff />
      </div>

      {/* LSF avatar + gesture capture */}
      <div className="mx-2 mt-2 grid grid-cols-[1fr_92px] gap-1.5">
        <div className="rounded-lg border p-2" style={{ borderColor: 'rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: FONT_MONO }}>
            <Captions className="h-2.5 w-2.5" /> Caption · LSF
          </div>
          <div className="mt-0.5 text-[10px] font-semibold text-white" style={{ fontFamily: FONT_BODY }}>
            Alice ouvre tableau ventes T4
          </div>
          <div className="mt-2 grid place-items-center">
            <StickFigureSigner gloses="ALICE OUVRIR TABLEAU VENTES" active size={88} accent={COLORS.blue} showCaption={false} />
          </div>
        </div>

        {/* gesture capture box */}
        <div
          className="relative overflow-hidden rounded-lg border"
          style={{ borderColor: COLORS.blue, background: 'rgba(61,139,240,0.10)' }}
        >
          <div className="absolute left-1 top-1 text-[8px] font-semibold uppercase tracking-wider" style={{ color: COLORS.blue, fontFamily: FONT_MONO }}>
            Capture
          </div>
          <ScanLine className="absolute right-1 top-1 h-2.5 w-2.5" style={{ color: COLORS.blue }} />
          <div className="absolute inset-x-1 bottom-1 top-5 grid place-items-center">
            <StickFigureSigner gloses="VOUS BONJOUR" active size={70} accent={COLORS.blue} showCaption={false} />
          </div>
          {/* scan line animation */}
          <motion.div
            className="absolute inset-x-0 h-[2px]"
            style={{ background: `linear-gradient(90deg, transparent, ${COLORS.blue}, transparent)` }}
            animate={{ y: [10, 95, 10] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </div>

      <PhoneControls />
    </>
  );
}

function BlindPhoneScreen() {
  return (
    <>
      <PhoneTopBar title="Aveugle" subtitle="Audio-first · IA TTS" />
      <div className="grid h-[420px] place-items-center">
        <div className="flex flex-col items-center">
          <motion.div
            animate={{ scale: [1, 1.06, 1], opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute h-44 w-44 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(61,139,240,0.40), transparent 70%)' }}
          />
          {[0, 0.4, 0.8].map((delay) => (
            <motion.div
              key={delay}
              className="absolute rounded-full"
              style={{ border: `1.5px solid ${COLORS.blue}` }}
              initial={{ width: 80, height: 80, opacity: 0.5 }}
              animate={{ width: 220, height: 220, opacity: 0 }}
              transition={{ delay, duration: 2.4, ease: 'easeOut', repeat: Infinity }}
            />
          ))}
          <div
            className="relative grid h-24 w-24 place-items-center rounded-3xl text-white"
            style={{ background: COLORS.blue, boxShadow: '0 0 40px rgba(61,139,240,0.6)' }}
          >
            <Mic className="h-10 w-10" />
          </div>
          <div className="relative mt-6 text-center">
            <div className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: FONT_MONO }}>
              IA · Description en cours
            </div>
            <div className="mt-1 max-w-[200px] text-[12px] text-white" style={{ fontFamily: FONT_BODY }}>
              Alice montre un graphique : ventes en hausse de 20 % au T4.
            </div>
          </div>
        </div>
      </div>
      <div className="mx-3 rounded-lg border px-2 py-1.5" style={{ borderColor: 'rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.05)' }}>
        <div className="flex items-center justify-between text-[10px]" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: FONT_MONO }}>
          <span>Volume</span>
          <span>90%</span>
        </div>
        <div className="mt-1 h-1 w-full overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.10)' }}>
          <div className="h-full w-[90%] rounded-full" style={{ background: COLORS.blue }} />
        </div>
      </div>
      <PhoneControls />
    </>
  );
}

function StandardPhoneScreen() {
  return (
    <>
      <PhoneTopBar title="Standard" subtitle="Vidéo · Chat · Partage" />
      <div className="mx-2 mt-2 grid grid-cols-2 gap-1.5" style={{ height: 360 }}>
        <PortraitTile {...TILE_PHOTOS[2]} speaking />
        <PortraitTile {...TILE_PHOTOS[3]} />
        <PortraitTile {...TILE_PHOTOS[4]} micOff />
        <PortraitTile {...TILE_PHOTOS[5]} self />
      </div>
      <div className="mx-2 mt-2 rounded-lg border px-2 py-1.5" style={{ borderColor: 'rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: FONT_MONO }}>
          <Sparkles className="h-2.5 w-2.5" style={{ color: COLORS.blue }} /> Récap discret
        </div>
        <div className="mt-0.5 text-[11px] text-white" style={{ fontFamily: FONT_BODY }}>
          Alice montre les ventes du dernier trimestre — c'est en hausse.
        </div>
      </div>
      <PhoneControls />
    </>
  );
}

function DesktopMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="relative mx-auto mt-16 w-full max-w-4xl"
    >
      <div
        className="rounded-2xl border p-3"
        style={{
          borderColor: COLORS.borderStrong,
          background: '#0E1320',
          boxShadow: '0 30px 60px rgba(11,31,58,0.20), 0 0 30px rgba(61,139,240,0.10)',
        }}
      >
        <div className="mb-2 flex items-center justify-between px-2">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#FF5F57' }} />
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#FEBC2E' }} />
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#28C840' }} />
          </div>
          <div className="rounded-md border px-2 py-0.5 text-[10px]" style={{ borderColor: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.65)', fontFamily: FONT_MONO }}>
            mymine.app/meeting/all
          </div>
          <div className="inline-flex items-center gap-1 text-[10px]" style={{ color: COLORS.red, fontFamily: FONT_MONO }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: COLORS.red }} />
            LIVE
          </div>
        </div>

        <div className="grid grid-cols-[1fr_220px] gap-3 p-2">
          {/* main : presenter + participants */}
          <div className="space-y-2">
            <div
              className="grid h-44 place-items-center rounded-lg text-white"
              style={{ background: 'linear-gradient(135deg, rgba(61,139,240,0.85), rgba(11,91,211,0.95))' }}
            >
              <div className="text-center">
                <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.75)', fontFamily: FONT_MONO }}>Partage d'écran · Alice</div>
                <div className="mt-1 text-2xl font-extrabold" style={{ fontFamily: FONT_TITLE }}>Ventes T4 +20%</div>
                <div className="mt-2 text-[12px]" style={{ color: 'rgba(255,255,255,0.85)', fontFamily: FONT_BODY }}>
                  « Le pic est en décembre, c'est positif partout. »
                </div>
              </div>
            </div>
            <div className="grid grid-cols-6 gap-1.5" style={{ height: 64 }}>
              {TILE_PHOTOS.map((p, i) => (
                <PortraitTile key={p.name} {...p} speaking={i === 0} self={i === 5} micOff={i === 2} />
              ))}
            </div>
          </div>

          {/* side: 3 profile panes */}
          <div className="grid grid-rows-[auto_auto_1fr] gap-2">
            <div className="rounded-lg border p-2" style={{ borderColor: 'rgba(255,255,255,0.10)' }}>
              <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: FONT_MONO }}>
                <EyeOff className="h-2.5 w-2.5" style={{ color: COLORS.blue }} /> Aveugle · TTS
              </div>
              <div className="mt-0.5 text-[11px] text-white" style={{ fontFamily: FONT_BODY }}>« Alice montre un graphique des ventes. »</div>
            </div>
            <div className="rounded-lg border p-2" style={{ borderColor: 'rgba(255,255,255,0.10)' }}>
              <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: FONT_MONO }}>
                <EarOff className="h-2.5 w-2.5" style={{ color: COLORS.blue }} /> Sourd · LSF
              </div>
              <div className="mt-0.5 text-[11px] text-white" style={{ fontFamily: FONT_BODY }}>ALICE MONTRER GRAPHIQUE VENTES</div>
              <div className="mt-2 grid place-items-center">
                <StickFigureSigner gloses="ALICE MONTRER GRAPHIQUE" active size={84} accent={COLORS.blue} showCaption={false} />
              </div>
            </div>
            <div className="rounded-lg border p-2" style={{ borderColor: 'rgba(255,255,255,0.10)' }}>
              <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: FONT_MONO }}>
                <Users className="h-2.5 w-2.5" style={{ color: COLORS.blue }} /> Standard · Récap
              </div>
              <div className="mt-0.5 text-[11px] text-white" style={{ fontFamily: FONT_BODY }}>Ventes en hausse au dernier trimestre, pic en décembre.</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 text-center text-xs" style={{ color: COLORS.textMuted, fontFamily: FONT_BODY }}>
        Vue desktop — les 3 interfaces, en une seule fenêtre d'inspiration.
      </div>
    </motion.div>
  );
}

function DevicesShowcase() {
  return (
    <section className="relative py-24" id="devices" style={{ background: COLORS.bgSoft }}>
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs" style={{ borderColor: COLORS.borderStrong, color: COLORS.blueDeep, background: COLORS.blueSoft, fontFamily: FONT_BODY }}>
              <Smartphone className="h-3.5 w-3.5" /> Mobile · Desktop
            </div>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight md:text-5xl" style={{ color: COLORS.text, fontFamily: FONT_TITLE }}>
              Sur le téléphone
              <br />
              <span style={{ color: COLORS.blue }}>ou sur l'ordinateur.</span>
            </h2>
          </div>
          <p className="max-w-md text-base" style={{ color: COLORS.textSoft, fontFamily: FONT_BODY }}>
            iPhone, Android, ordinateur — la même réunion. Mais chacun voit la version qui lui
            convient, y compris depuis une chambre d'hôpital ou un fauteuil de salon.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 items-center gap-10 lg:grid-cols-3">
          <div className="flex justify-center">
            <PhoneFrame label="Sourd · Muet"><DeafPhoneScreen /></PhoneFrame>
          </div>
          <div className="flex justify-center">
            <PhoneFrame label="Aveugle"><BlindPhoneScreen /></PhoneFrame>
          </div>
          <div className="flex justify-center">
            <PhoneFrame label="Standard"><StandardPhoneScreen /></PhoneFrame>
          </div>
        </div>

        <DesktopMockup />

        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/select"
            className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition"
            style={{ background: COLORS.blue, boxShadow: '0 10px 28px rgba(61,139,240,0.35)', fontFamily: FONT_BODY }}
          >
            <Video className="h-4 w-4" /> Lancer une réunion maintenant
          </Link>
          <a
            href="#interfaces"
            className="inline-flex items-center gap-2 rounded-xl border px-6 py-3 text-sm font-semibold transition hover:bg-white"
            style={{ borderColor: COLORS.borderStrong, color: COLORS.text, fontFamily: FONT_BODY, background: COLORS.surface }}
          >
            Détails par interface <ChevronRight className="h-4 w-4" />
          </a>
        </div>

        <div className="mt-6 text-center text-xs" style={{ color: COLORS.textMuted, fontFamily: FONT_BODY }}>
          Photos portraits : libres de droits (Unsplash). Esthétique inspirée de Pinterest.
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- */
/*  Interfaces cards                                               */
/* -------------------------------------------------------------- */

function InterfacesSection() {
  const cards = [
    {
      id: 'standard',
      Icon: Users,
      title: 'Standard',
      tag: 'Caméra · Micro · Chat',
      desc: "La visio comme on la connaît : caméra, micro, chat, partage d'écran. Avec, sur le côté, un petit résumé écrit quand on revient d'une pause.",
      features: ['Vidéo et audio en direct', 'Chat texte', 'Partage d\'écran', 'Lever la main, couper son micro'],
    },
    {
      id: 'blind',
      Icon: EyeOff,
      title: 'Aveugle ou malvoyant',
      tag: 'Tout passe par la voix',
      desc: "Tout est dit à voix haute : qui entre, qui sort, qui lève la main, ce qui est montré à l'écran. On peut piloter à la voix ou au clavier.",
      features: ['Lecture vocale des messages', 'Description parlée des écrans partagés', 'Pilotage à la voix ou au clavier', 'Volume et priorité réglables'],
    },
    {
      id: 'deaf',
      Icon: EarOff,
      title: 'Sourd ou muet',
      tag: 'Sous-titres &amp; langue des signes',
      desc: "Sous-titres en direct, un avatar qui reprend la phrase en LSF, et — c'est nouveau — la caméra peut lire vos propres signes et les traduire pour les autres.",
      features: ['Sous-titres en direct', 'Avatar qui signe en LSF', 'Caméra qui lit vos gestes', 'Texte écrit → lu à voix haute', 'Partage d\'écran possible'],
    },
  ];

  return (
    <section className="relative py-24" id="interfaces">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs" style={{ borderColor: COLORS.borderStrong, color: COLORS.blueDeep, background: COLORS.blueSoft, fontFamily: FONT_BODY }}>
              <Accessibility className="h-3.5 w-3.5" /> 3 interfaces. 1 même réunion.
            </div>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight md:text-5xl" style={{ color: COLORS.text, fontFamily: FONT_TITLE }}>
              Une réunion,
              <br /> trois façons d'y participer.
            </h2>
          </div>
          <p className="max-w-md text-base" style={{ color: COLORS.textSoft, fontFamily: FONT_BODY }}>
            Un seul appel, trois rendus différents. On choisit son profil au moment d'entrer, et l'on
            peut en changer à tout instant pendant la réunion.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          {cards.map(({ id, Icon, title, tag, desc, features }, idx) => (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.55 }}
              className="group relative overflow-hidden rounded-3xl border p-6 transition hover:-translate-y-1"
              style={{
                borderColor: COLORS.border,
                background: COLORS.surface,
                boxShadow: '0 10px 30px rgba(11,31,58,0.06)',
              }}
            >
              <div className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${COLORS.blue}, transparent)` }} />
              <div className="flex items-center justify-between">
                <div
                  className="grid h-12 w-12 place-items-center rounded-2xl"
                  style={{ background: COLORS.blueSoft, color: COLORS.blue, boxShadow: '0 0 24px rgba(61,139,240,0.18)' }}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <span className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider" style={{ borderColor: COLORS.border, color: COLORS.textSoft, background: COLORS.bgSoft, fontFamily: FONT_MONO }}>
                  {tag}
                </span>
              </div>

              <h3 className="mt-5 text-xl font-bold" style={{ color: COLORS.text, fontFamily: FONT_TITLE }}>
                {title}
              </h3>
              <p className="mt-2 text-sm" style={{ color: COLORS.textSoft, fontFamily: FONT_BODY }}>
                {desc}
              </p>

              <ul className="mt-5 space-y-2 text-sm" style={{ color: COLORS.text, fontFamily: FONT_BODY }}>
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: COLORS.blue }} />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                to="/select"
                state={{ presetProfile: id }}
                className="mt-6 inline-flex items-center gap-1 text-sm font-semibold transition hover:opacity-80"
                style={{ color: COLORS.blue, fontFamily: FONT_BODY }}
              >
                Entrer en profil {title.split(' ').slice(-1)[0]}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- */
/*  Workflow                                                       */
/* -------------------------------------------------------------- */

function WorkflowSection() {
  const steps = [
    { Icon: Mic,      label: 'On écoute',     desc: 'Parole, partage d\'écran, chat, gestes — tout est capté en direct.' },
    { Icon: Brain,    label: 'On comprend',   desc: 'On retient l\'idée et l\'urgence, pas chaque mot.' },
    { Icon: Sparkles, label: 'On reformule',  desc: 'Une version courte pour chaque profil : voix, sous-titres, LSF.' },
    { Icon: Radio,    label: 'On envoie',     desc: 'Chacun reçoit ce qui le concerne, dans la forme qui va bien.' },
  ];

  return (
    <section className="relative py-24" id="workflow" style={{ background: COLORS.bgSoft }}>
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs" style={{ borderColor: COLORS.borderStrong, color: COLORS.blueDeep, background: COLORS.surface, fontFamily: FONT_BODY }}>
              <Brain className="h-3.5 w-3.5" /> Comment ça marche
            </div>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight md:text-5xl" style={{ color: COLORS.text, fontFamily: FONT_TITLE }}>
              Comment MyMine
              <br /> traduit votre réunion.
            </h2>
          </div>
          <p className="hidden max-w-sm text-base md:block" style={{ color: COLORS.textSoft, fontFamily: FONT_BODY }}>
            Tout ce qui se passe en réunion — une voix, un partage d'écran, un message — est repris
            par MyMine et présenté différemment à chaque personne, selon ce qu'elle peut percevoir.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-4">
          {steps.map(({ Icon, label, desc }, idx) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="relative rounded-2xl border p-5"
              style={{ borderColor: COLORS.border, background: COLORS.surface, boxShadow: '0 6px 18px rgba(11,31,58,0.05)' }}
            >
              <div className="flex items-center gap-2 text-xs" style={{ color: COLORS.textSoft, fontFamily: FONT_MONO }}>
                <span>{String(idx + 1).padStart(2, '0')}</span>
                <span>·</span>
                <span>étape</span>
              </div>
              <div className="mt-4 inline-flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: COLORS.blueSoft, color: COLORS.blue }}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-3 text-base font-semibold" style={{ color: COLORS.text, fontFamily: FONT_TITLE }}>
                {label}
              </div>
              <div className="mt-1 text-sm" style={{ color: COLORS.textSoft, fontFamily: FONT_BODY }}>
                {desc}
              </div>

              {idx < steps.length - 1 ? (
                <ChevronRight className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 md:block" style={{ color: COLORS.borderStrong }} />
              ) : null}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- */
/*  Stories                                                        */
/* -------------------------------------------------------------- */

function CustomerStories() {
  const stories = [
    {
      name: 'Yann, 34 ans',
      role: 'Chef de projet · non-voyant',
      quote: "Pour la première fois, je suis tout ce qui se passe à l'écran sans qu'on doive me décrire la slide à la voix. MyMine le fait, mieux qu'un humain.",
    },
    {
      name: 'Inès, 28 ans',
      role: 'Designeuse · sourde de naissance',
      quote: "Les sous-titres sont lisibles, l'avatar LSF reprend l’intention, et MES gestes sont aussi capturés et traduits. Je participe aux daily sans interprète humain.",
    },
    {
      name: 'Marc, 41 ans',
      role: 'Manager · équipe mixte',
      quote: "Je ne change rien à mes habitudes. Mais maintenant toute mon équipe — y compris Yann et Inès — vit la même réunion en même temps.",
    },
  ];

  return (
    <section className="relative py-24" id="stories">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs" style={{ borderColor: COLORS.borderStrong, color: COLORS.blueDeep, background: COLORS.blueSoft, fontFamily: FONT_BODY }}>
              <Users className="h-3.5 w-3.5" /> Témoignages
            </div>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight md:text-5xl" style={{ color: COLORS.text, fontFamily: FONT_TITLE }}>
              Pensé avec les
              <br /> premiers concernés.
            </h2>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          {stories.map((s, idx) => (
            <motion.figure
              key={s.name}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="relative overflow-hidden rounded-3xl border p-6"
              style={{ borderColor: COLORS.border, background: COLORS.surface, boxShadow: '0 8px 24px rgba(11,31,58,0.05)' }}
            >
              <div className="absolute right-4 top-4 text-6xl leading-none" style={{ color: COLORS.blue, opacity: 0.18, fontFamily: FONT_TITLE }}>“</div>
              <blockquote className="text-base" style={{ color: COLORS.text, fontFamily: FONT_BODY }}>
                {s.quote}
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <div
                  className="grid h-10 w-10 place-items-center rounded-full text-sm font-bold text-white"
                  style={{ background: COLORS.blue, fontFamily: FONT_TITLE }}
                >
                  {s.name[0]}
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: COLORS.text, fontFamily: FONT_BODY }}>{s.name}</div>
                  <div className="text-xs" style={{ color: COLORS.textSoft, fontFamily: FONT_BODY }}>{s.role}</div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- */
/*  CTA + Footer                                                   */
/* -------------------------------------------------------------- */

function CTASection() {
  return (
    <section className="relative py-24" style={{ background: COLORS.bgSoft }}>
      <div className="relative mx-auto max-w-5xl px-6">
        <div
          className="relative overflow-hidden rounded-[2.5rem] border p-10 text-center md:p-16"
          style={{
            borderColor: COLORS.borderStrong,
            background:
              'radial-gradient(800px 300px at 50% 0%, rgba(61,139,240,0.16), transparent 60%), radial-gradient(800px 300px at 50% 100%, rgba(61,139,240,0.10), transparent 60%), #FFFFFF',
            boxShadow: '0 24px 60px rgba(11,31,58,0.08)',
          }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs" style={{ borderColor: COLORS.borderStrong, color: COLORS.blueDeep, background: COLORS.blueSoft, fontFamily: FONT_BODY }}>
            <MonitorPlay className="h-3.5 w-3.5" />
            On commence quand vous voulez
          </div>
          <h2 className="mx-auto mt-5 max-w-3xl text-3xl font-extrabold tracking-tight md:text-5xl" style={{ color: COLORS.text, fontFamily: FONT_TITLE }}>
            Tout le monde participe. <span style={{ color: COLORS.blue }}>Vraiment.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base md:text-lg" style={{ color: COLORS.textSoft, fontFamily: FONT_BODY }}>
            Choisissez votre profil, créez une salle, partagez le lien. Voilà — le reste se met en
            place tout seul, sans installation ni paramètres compliqués.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/select"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition"
              style={{ background: COLORS.blue, boxShadow: '0 10px 28px rgba(61,139,240,0.40)', fontFamily: FONT_BODY }}
            >
              <Video className="h-4 w-4" /> Démarrer une réunion
            </Link>
            <Link
              to="/select"
              className="inline-flex items-center gap-2 rounded-xl border px-6 py-3 text-sm font-semibold transition hover:bg-[#F4F7FB]"
              style={{ borderColor: COLORS.borderStrong, color: COLORS.text, fontFamily: FONT_BODY, background: COLORS.surface }}
            >
              <CalendarPlus className="h-4 w-4" /> Rejoindre une room
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const cols = [
    { title: 'Découvrir',     links: ['L\'assistant', 'Profil standard', 'Profil aveugle', 'Profil sourd-muet'] },
    { title: 'En pratique',   links: ['Démarrer une réunion', 'Rejoindre une salle', 'Aide aux organisateurs', 'Conseils en milieu médical'] },
    { title: 'Accessibilité', links: ['Lisibilité', 'Raccourcis clavier', 'Lecteurs d\'écran', 'Langue des signes'] },
    { title: 'Nous',          links: ['Notre démarche', 'Nous écrire', 'Statut du service', 'Politique de confidentialité'] },
  ];
  return (
    <footer className="border-t" style={{ borderColor: COLORS.border, background: COLORS.bg }}>
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/mymine-logo.svg" alt="MyMine" className="h-9 w-9" style={{ filter: 'drop-shadow(0 2px 10px rgba(61,139,240,0.30))' }} />
              <span className="text-xl font-extrabold" style={{ color: COLORS.text, fontFamily: FONT_TITLE }}>
                MyMine
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm" style={{ color: COLORS.textSoft, fontFamily: FONT_BODY }}>
              Une visioconférence qui s'ajuste aux gens, et pas l'inverse. Lisible, calme, simple à utiliser —
              y compris à l'hôpital, en EHPAD ou depuis chez soi.
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <div className="text-xs uppercase tracking-wider" style={{ color: COLORS.textSoft, fontFamily: FONT_MONO }}>{c.title}</div>
              <ul className="mt-3 space-y-2 text-sm" style={{ color: COLORS.text, fontFamily: FONT_BODY }}>
                {c.links.map((l) => (
                  <li key={l}><a href="#" className="transition hover:text-[#3D8BF0]">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t pt-6 md:flex-row md:items-center" style={{ borderColor: COLORS.border }}>
          <div className="text-xs" style={{ color: COLORS.textMuted, fontFamily: FONT_BODY }}>
            © {new Date().getFullYear()} MyMine. Pour que personne ne reste à la porte d'une réunion.
          </div>
          <div className="flex items-center gap-4 text-xs" style={{ color: COLORS.textSoft, fontFamily: FONT_BODY }}>
            <a href="#">Confidentialité</a>
            <a href="#">Conditions</a>
            <a href="#">Mentions légales</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* -------------------------------------------------------------- */
/*  Page entry                                                     */
/* -------------------------------------------------------------- */

export function LandingPage() {
  return (
    <div className="min-h-screen w-full" style={{ background: COLORS.bg, color: COLORS.text }}>
      <AnnouncementBar />
      <Nav />
      <Hero />
      <StatsStrip />
      <AICompanionBlock />
      <DevicesShowcase />
      <InterfacesSection />
      <WorkflowSection />
      <CustomerStories />
      <CTASection />
      <Footer />
    </div>
  );
}
