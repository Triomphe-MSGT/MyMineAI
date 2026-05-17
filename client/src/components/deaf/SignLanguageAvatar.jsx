import { StickFigureSigner } from './StickFigureSigner.jsx';

export function SignLanguageAvatar({ text, gloses, compact = false, figureSize, signCycleMs }) {
  const hasIA = Boolean(gloses && gloses.trim().length > 0);
  const active = Boolean(text || gloses);
  const compactSz = figureSize ?? 150;
  const fullSz = figureSize ?? 170;

  if (compact) {
    return (
      <div className="flex flex-col items-center justify-center">
        <StickFigureSigner
          gloses={gloses}
          active={active}
          size={compactSz}
          accent="#3D8BF0"
          showCaption={false}
          signCycleMs={signCycleMs}
        />
        <div
          className="mt-1 text-center text-[10px] uppercase tracking-wider"
          style={{ color: hasIA ? '#3D8BF0' : '#A0ABBD', fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
        >
          {hasIA ? 'LSF en direct' : 'Avatar LSF · idle'}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#DDE5EF] bg-[#FFFFFF] p-4">
      <div className="flex items-center justify-between">
        <div
          className="text-sm font-semibold text-[#1F2D4A]"
          style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}
        >
          Avatar LSF
        </div>
        <span
          className="rounded-full border border-[#DDE5EF] px-2 py-0.5 text-[10px] uppercase tracking-wider"
          style={{
            color: hasIA ? '#3D8BF0' : '#607089',
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          }}
        >
          {hasIA ? 'IA · gloses' : 'idle'}
        </span>
      </div>

      <div className="mt-3 flex items-start gap-3">
        <div className="shrink-0">
          <StickFigureSigner gloses={gloses} active={active} size={fullSz} accent="#3D8BF0" signCycleMs={signCycleMs} />
        </div>

        <div className="min-w-0 flex-1 self-stretch rounded-xl border border-[#DDE5EF] bg-[#F4F7FB] p-3">
          <div
            className="text-[10px] uppercase tracking-wider text-[#607089]"
            style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
          >
            Caption
          </div>
          <div
            className="mt-1 text-sm text-[#1F2D4A]"
            style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}
          >
            {text || 'En attente de paroles…'}
          </div>
          {hasIA ? (
            <>
              <div
                className="mt-3 text-[10px] uppercase tracking-wider text-[#607089]"
                style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
              >
                Gloses LSF
              </div>
              <div
                className="mt-1 break-words text-[12px] tracking-wider text-[#3D8BF0]"
                style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
              >
                {gloses}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
