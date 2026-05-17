import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const SHOWN_KEY = 'mymine.splash.shown';

/**
 * SplashScreen — Logo MyMine AI animé au lancement.
 * Affiche le logo avec un effet "reveal" (échelle + glow + sweep)
 * pendant ~2.4s, puis fade out. Une seule fois par session (sessionStorage).
 */
export function SplashScreen() {
  const [visible, setVisible] = useState(() => {
    try {
      return typeof window !== 'undefined' && !window.sessionStorage.getItem(SHOWN_KEY);
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (!visible) return undefined;
    const t = setTimeout(() => {
      try {
        window.sessionStorage.setItem(SHOWN_KEY, '1');
      } catch {
        // ignore
      }
      setVisible(false);
    }, 2400);
    return () => clearTimeout(t);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="fixed inset-0 z-[80] grid place-items-center overflow-hidden"
          style={{
            background:
              'radial-gradient(800px 500px at 50% 40%, rgba(61,139,240,0.18), transparent 60%), radial-gradient(700px 400px at 50% 60%, rgba(61,139,240,0.10), transparent 60%), #FFFFFF',
          }}
          aria-hidden
        >
          {/* Grid pulse background */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0.2] }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
            style={{
              backgroundImage:
                'linear-gradient(rgba(61,139,240,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(61,139,240,0.08) 1px, transparent 1px)',
              backgroundSize: '64px 64px',
              maskImage: 'radial-gradient(circle at 50% 50%, black 0%, transparent 70%)',
              WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 0%, transparent 70%)',
            }}
          />

          {/* Ring pulses */}
          {[0, 0.4, 0.8].map((delay) => (
            <motion.div
              key={delay}
              className="pointer-events-none absolute rounded-full"
              style={{ borderColor: '#3D8BF0', borderWidth: 1.5, borderStyle: 'solid' }}
              initial={{ width: 80, height: 80, opacity: 0.7 }}
              animate={{ width: 520, height: 520, opacity: 0 }}
              transition={{ delay, duration: 1.8, ease: 'easeOut', repeat: 1 }}
            />
          ))}

          <div className="relative flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.65, opacity: 0, rotate: -8 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="relative grid place-items-center"
            >
              {/* Glow halo */}
              <motion.div
                className="absolute h-44 w-44 rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(61,139,240,0.45), transparent 65%)', filter: 'blur(8px)' }}
                animate={{ scale: [0.9, 1.1, 1], opacity: [0.6, 1, 0.85] }}
                transition={{ duration: 1.6, ease: 'easeInOut', repeat: Infinity }}
              />
              {/* Logo */}
              <motion.img
                src="/mymine-logo.png"
                alt="MyMine AI"
                className="relative h-32 w-32 select-none"
                draggable={false}
                style={{ filter: 'drop-shadow(0 0 24px rgba(61,139,240,0.55))' }}
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2.2, ease: 'easeInOut', repeat: Infinity }}
              />
              {/* Scanline sweep */}
              <motion.div
                className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.6, ease: 'easeOut' }}
              >
                <motion.div
                  className="absolute -inset-x-1/2 h-24"
                  style={{
                    background:
                      'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.18) 45%, rgba(61,139,240,0.6) 50%, rgba(255,255,255,0.18) 55%, transparent 100%)',
                    filter: 'blur(3px)',
                  }}
                  initial={{ y: -120 }}
                  animate={{ y: 200 }}
                  transition={{ duration: 1.6, ease: 'easeOut' }}
                />
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.55 }}
              className="mt-8 text-center"
            >
              <div
                className="text-3xl font-extrabold tracking-tight md:text-4xl"
                style={{ color: '#1F2D4A' }}
              >
                MyMine <span style={{ color: '#3D8BF0' }}>AI</span>
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="mt-2 text-sm md:text-base"
                style={{ color: '#607089' }}
              >
                La réunion qui parle à tout le monde.
              </motion.div>

              {/* Loader bar */}
              <div className="mx-auto mt-6 h-[3px] w-44 overflow-hidden rounded-full" style={{ background: '#F4F7FB' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #3D8BF0, #3D8BF0)' }}
                  initial={{ x: '-100%' }}
                  animate={{ x: '0%' }}
                  transition={{ duration: 1.8, ease: 'easeInOut' }}
                />
              </div>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
