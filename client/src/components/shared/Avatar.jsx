/** Palettes type « galerie » (initiales sur fond coloré). */
const PALETTES = [
  ['#0E72ED', '#2D8CFF'],
  ['#238636', '#3FB950'],
  ['#5B4FCF', '#7C6AE8'],
  ['#D97706', '#F59E0B'],
  ['#BE185D', '#EC4899'],
  ['#0D9488', '#14B8A6'],
  ['#7C3AED', '#A78BFA'],
  ['#B45309', '#D97706'],
];

function paletteForName(name = '') {
  let h = 0;
  const s = String(name);
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return PALETTES[h % PALETTES.length];
}

const SIZE_CLASSES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-12 w-12 text-lg',
  lg: 'h-20 w-20 text-2xl',
  xl: 'h-24 w-24 text-3xl sm:h-32 sm:w-32 sm:text-4xl',
};

/**
 * Initiales sur fond coloré (style galerie type Zoom) — pas d’URL photo côté serveur pour l’instant.
 */
export function Avatar({
  name = '?',
  profile = 'standard',
  size = 'sm',
  variant = 'square',
  className = '',
  photoUrl,
}) {
  const initial = (name || '?').trim().slice(0, 1).toUpperCase();
  const [c1, c2] = paletteForName(name);
  const ring =
    profile === 'blind'
      ? 'ring-2 ring-[#3D8BF0]/40'
      : profile === 'deaf'
        ? 'ring-2 ring-[#3D8BF0]/35'
        : 'ring-2 ring-white/50';

  const dim = SIZE_CLASSES[size] || SIZE_CLASSES.sm;
  const shape = variant === 'circle' ? 'rounded-full' : 'rounded-xl';

  if (photoUrl) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden border border-white/30 bg-[#E8EDF5] ${dim} ${shape} ${ring} ${className}`}
        aria-label={`Photo ${name}`}
        title={name}
      >
        <img src={photoUrl} alt="" className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`grid shrink-0 place-items-center border border-white/25 font-bold text-white shadow-inner ${dim} ${shape} ${ring} ${className}`}
      style={{
        fontFamily: "'Open Sans', system-ui, sans-serif",
        background: `linear-gradient(145deg, ${c1} 0%, ${c2} 100%)`,
        boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
      }}
      aria-label={`Avatar ${name}`}
      title={name}
    >
      {initial}
    </div>
  );
}
