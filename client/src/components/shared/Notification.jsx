import { motion } from 'framer-motion';

export function Notification({ text }) {
  if (!text) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-2xl border border-[#DDE5EF] bg-[#FFFFFF]/90 px-4 py-3 text-sm text-[#1F2D4A] backdrop-blur"
      style={{ fontFamily: "'Open Sans', system-ui, sans-serif", boxShadow: '0 0 20px rgba(61,139,240,0.12)' }}
      role="status"
    >
      {text}
    </motion.div>
  );
}

