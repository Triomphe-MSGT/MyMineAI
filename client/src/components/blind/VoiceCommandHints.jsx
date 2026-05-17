export function VoiceCommandHints() {
  const hints = [
    'lever la main',
    'baisser la main',
    'couper mon micro',
    'activer mon micro',
    'qui parle',
    'résumer la réunion',
    'lire les messages',
  ];

  return (
    <div className="rounded-2xl border border-[#DDE5EF] bg-[#FFFFFF] p-4">
      <div className="text-sm font-semibold text-[#1F2D4A]" style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}>
        Commandes vocales
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2">
        {hints.map((h) => (
          <div key={h} className="rounded-xl border border-[#DDE5EF] bg-[#F4F7FB] px-3 py-2 text-sm text-[#1F2D4A]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            {h}
          </div>
        ))}
      </div>
    </div>
  );
}

