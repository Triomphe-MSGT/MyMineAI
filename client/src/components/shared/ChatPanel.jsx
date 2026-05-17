import { useState } from 'react';

export function ChatPanel({ messages = [], onSend }) {
  const [text, setText] = useState('');

  return (
    <div className="rounded-2xl border border-[#DDE5EF] bg-[#FFFFFF] p-4">
      <div className="text-sm font-semibold text-[#1F2D4A]" style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}>
        Chat
      </div>

      <div className="mt-3 max-h-72 space-y-2 overflow-auto rounded-xl border border-[#DDE5EF] bg-[#F4F7FB] p-3">
        {messages.length === 0 ? (
          <div className="text-sm text-[#607089]" style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}>
            Aucun message.
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id || `${m.senderId}-${m.timestamp}`} className="text-sm" style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}>
              <span className="font-semibold text-[#1F2D4A]">{m.senderName || '—'}</span>
              <span className="text-[#607089]"> : </span>
              <span className="text-[#1F2D4A]">{m.text}</span>
            </div>
          ))
        )}
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
          placeholder="Écrire un message…"
          className="w-full rounded-xl border border-[#DDE5EF] bg-[#F4F7FB] px-4 py-3 text-sm text-[#1F2D4A] outline-none focus:border-[#3b82f6]"
          style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}
        />
        <button
          type="submit"
          className="rounded-xl bg-[#3b82f6] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ fontFamily: "'Open Sans', system-ui, sans-serif", boxShadow: '0 0 20px rgba(59,130,246,0.25)' }}
        >
          Envoyer
        </button>
      </form>
    </div>
  );
}

