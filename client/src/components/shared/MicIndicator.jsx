import { motion } from 'framer-motion';

export function MicIndicator({ isSpeaking, dark = false, size = 'sm' }) {
  const dim = size === 'lg' ? 'h-3.5 w-3.5' : 'h-2 w-2';
  const pulse = size === 'lg' ? [1, 1.45, 1] : [1, 1.35, 1];
  const idle = dark ? 'bg-white/45' : 'bg-[#A0ABBD]';
  if (!isSpeaking) {
    return <div className={`rounded-full ${dim} ${idle}`} />;
  }

  return (
    <motion.div
      className={`rounded-full bg-[#3D8BF0] ${dim}`}
      animate={{ opacity: [0.4, 1, 0.4], scale: pulse }}
      transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
      style={{ boxShadow: '0 0 20px rgba(61,139,240,0.3)' }}
      aria-label="Parle"
      title="Parle"
    />
  );
}

