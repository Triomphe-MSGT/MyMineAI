import { useState } from 'react';

export function TextToSpeechInput({ onSend, placeholder = 'Envoyer à voix haute…' }) {
  const [text, setText] = useState('');

  return (
    <div className="rounded-2xl border border-[#DDE5EF] bg-[#FFFFFF] p-4">
      <div className="text-sm font-semibold text-[#1F2D4A]" style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}>
        Écrire → Voix
      </div>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const cleaned = text.trim();
          if (!cleaned) return;
          onSend?.(cleaned);
          setText('');
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-[#DDE5EF] bg-[#F4F7FB] px-4 py-3 text-sm text-[#1F2D4A] outline-none focus:border-[#3D8BF0]"
          style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}
        />
        <button
          type="submit"
          className="rounded-xl bg-[#3D8BF0] px-4 py-3 text-sm font-semibold text-[#FFFFFF] transition hover:opacity-90"
          style={{ fontFamily: "'Open Sans', system-ui, sans-serif", boxShadow: '0 0 20px rgba(61,139,240,0.3)' }}
        >
          Envoyer
        </button>
      </form>
    </div>
  );
}

