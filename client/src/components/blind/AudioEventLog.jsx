export function AudioEventLog({ events = [] }) {
  return (
    <div className="rounded-2xl border border-[#DDE5EF] bg-[#FFFFFF] p-4">
      <div className="text-sm font-semibold text-[#1F2D4A]" style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}>
        AudioEventLog
      </div>
      <div className="mt-3 max-h-72 space-y-2 overflow-auto rounded-xl border border-[#DDE5EF] bg-[#F4F7FB] p-3">
        {events.length === 0 ? (
          <div className="text-sm text-[#607089]" style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}>
            Aucun événement.
          </div>
        ) : (
          events.slice(-30).map((e) => (
            <div key={e.id} className="text-sm text-[#1F2D4A]" style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}>
              <span className="text-[#607089]">[{new Date(e.timestamp).toLocaleTimeString()}]</span> {e.text}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

