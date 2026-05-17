import { useCallback, useLayoutEffect, useRef } from 'react';

/**
 * Ajuste scale pour que le contenu tienne dans le cadre (largeur + hauteur),
 * sans barre de défilement interne — utilisé pour la démo triple colonne.
 */
export function DemoViewportFit({ children, depsKey = '', className = '' }) {
  const outerRef = useRef(null);
  const innerRef = useRef(null);

  const update = useCallback(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const cw = outer.clientWidth;
    const ch = outer.clientHeight;
    if (cw < 4 || ch < 4) return;

    inner.style.transform = 'scale(1)';
    const iw = Math.max(inner.scrollWidth, inner.offsetWidth);
    const ih = Math.max(inner.scrollHeight, inner.offsetHeight);
    if (iw < 1 || ih < 1) return;

    const s = Math.min(1, cw / iw, ch / ih);
    inner.style.transform = `scale(${s})`;
  }, []);

  useLayoutEffect(() => {
    update();
    const ro = new ResizeObserver(() => update());
    if (outerRef.current) ro.observe(outerRef.current);
    if (innerRef.current) ro.observe(innerRef.current);
    window.addEventListener('resize', update);
    let n = 0;
    const raf = () => {
      n += 1;
      update();
      if (n < 10) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [update, depsKey]);

  return (
    <div
      ref={outerRef}
      className={['relative h-full min-h-0 w-full min-w-0 overflow-hidden', className].filter(Boolean).join(' ')}
    >
      <div ref={innerRef} className="absolute left-0 top-0 w-full min-w-0 origin-top-left will-change-transform">
        {children}
      </div>
    </div>
  );
}
