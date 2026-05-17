import { useEffect, useState } from 'react';

/**
 * Crée des MediaStream factices (canvas + captureStream) pour la démo :
 * caméras simulées + flux « partage d’écran », sans webcam ni capture réelle.
 */
export function useSimulatedDemoStreams() {
  const [streams, setStreams] = useState({
    aliceWebcam: null,
    bobWebcam: null,
    carlaWebcam: null,
    presentation: null,
  });

  useEffect(() => {
    const W = 720;
    const H = 405;
    const Ws = 960;
    const Hs = 540;

    const mk = (w, h) => {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      return c;
    };

    const aliceCanvas = mk(W, H);
    const bobCanvas = mk(W, H);
    const carlaCanvas = mk(W, H);
    const screenCanvas = mk(Ws, Hs);

    const aCtx = aliceCanvas.getContext('2d');
    const bCtx = bobCanvas.getContext('2d');
    const cCtx = carlaCanvas.getContext('2d');
    const sCtx = screenCanvas.getContext('2d');

    const t0 = performance.now();
    let raf = 0;

    const drawRounded = (ctx, x, y, w, h, r, fill) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
    };

    const frame = (now) => {
      const t = (now - t0) / 1000;
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.2);

      /* --- Alice : « webcam » --- */
      const ag = aCtx.createLinearGradient(0, 0, W, H);
      ag.addColorStop(0, '#1e3a5f');
      ag.addColorStop(1, '#3d8bf0');
      aCtx.fillStyle = ag;
      aCtx.fillRect(0, 0, W, H);
      aCtx.fillStyle = 'rgba(255,255,255,0.12)';
      for (let i = 0; i < 5; i += 1) {
        aCtx.beginPath();
        aCtx.arc((W / 6) * (i + 1), H * 0.35 + Math.sin(t + i) * 8, 28 + pulse * 10, 0, Math.PI * 2);
        aCtx.fill();
      }
      aCtx.fillStyle = '#fff';
      aCtx.font = 'bold 22px "Open Sans", sans-serif';
      aCtx.fillText('Alice', 24, H - 52);
      aCtx.font = '13px "JetBrains Mono", monospace';
      aCtx.fillStyle = 'rgba(255,255,255,0.85)';
      aCtx.fillText('Caméra simulée · profil standard', 24, H - 24);

      /* --- Bob : image animée légère --- */
      bCtx.fillStyle = '#232629';
      bCtx.fillRect(0, 0, W, H);
      drawRounded(bCtx, W / 2 - 70, H / 2 - 70, 140, 140, 24, '#3d8bf0');
      bCtx.fillStyle = '#fff';
      bCtx.font = 'bold 48px "Open Sans", sans-serif';
      bCtx.textAlign = 'center';
      bCtx.fillText('B', W / 2, H / 2 + 18);
      bCtx.textAlign = 'left';
      bCtx.font = 'bold 20px "Open Sans", sans-serif';
      bCtx.fillText('Bob', 24, H - 48);
      bCtx.font = '12px "JetBrains Mono", monospace';
      bCtx.fillStyle = 'rgba(255,255,255,0.75)';
      bCtx.fillText('Vidéo simulée · aveugle', 24, H - 22);

      /* --- Carla --- */
      const cg = cCtx.createLinearGradient(0, 0, W, H);
      cg.addColorStop(0, '#0d3d38');
      cg.addColorStop(1, '#14b8a6');
      cCtx.fillStyle = cg;
      cCtx.fillRect(0, 0, W, H);
      drawRounded(cCtx, W / 2 - 64, H / 2 - 64, 128, 128, 28, 'rgba(255,255,255,0.2)');
      cCtx.fillStyle = '#fff';
      cCtx.font = 'bold 44px "Open Sans", sans-serif';
      cCtx.textAlign = 'center';
      cCtx.fillText('C', W / 2, H / 2 + 16);
      cCtx.textAlign = 'left';
      cCtx.font = 'bold 20px "Open Sans", sans-serif';
      cCtx.fillText('Carla', 24, H - 48);
      cCtx.font = '12px "JetBrains Mono", monospace';
      cCtx.fillStyle = 'rgba(255,255,255,0.8)';
      cCtx.fillText('Caméra simulée · LSF', 24, H - 22);

      /* --- Partage d’écran : graphique animé --- */
      const sky = sCtx.createLinearGradient(0, 0, 0, Hs);
      sky.addColorStop(0, '#0f172a');
      sky.addColorStop(1, '#1e293b');
      sCtx.fillStyle = sky;
      sCtx.fillRect(0, 0, Ws, Hs);
      sCtx.strokeStyle = 'rgba(148,163,184,0.35)';
      sCtx.lineWidth = 1;
      for (let g = 0; g < 6; g += 1) {
        const y = 80 + g * 70;
        sCtx.beginPath();
        sCtx.moveTo(48, y);
        sCtx.lineTo(Ws - 48, y);
        sCtx.stroke();
      }
      const bars = [0.42, 0.58, 0.72 + pulse * 0.06, 0.91, 0.68, 1.05];
      const bw = 56;
      const gap = 24;
      const baseY = Hs - 72;
      bars.forEach((h, i) => {
        const bh = h * 200;
        const x = 72 + i * (bw + gap);
        const col = i === 2 ? '#3b82f6' : '#475569';
        drawRounded(sCtx, x, baseY - bh, bw, bh, 8, col);
        if (i === 2) {
          sCtx.fillStyle = '#22c55e';
          sCtx.font = 'bold 13px "JetBrains Mono", monospace';
          sCtx.fillText('+12 %', x + 8, baseY - bh - 10);
        }
      });
      sCtx.fillStyle = '#f8fafc';
      sCtx.font = 'bold 26px "Open Sans", sans-serif';
      sCtx.fillText('Partage d’écran simulé — Ventes Q1 · Q2 · Q3', 48, 52);
      sCtx.font = '14px "JetBrains Mono", monospace';
      sCtx.fillStyle = 'rgba(226,232,240,0.85)';
      sCtx.fillText(`Frame ~${Math.floor(t * 12) % 24}/24 · aucune saisie réelle`, 48, 78);

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);

    const aliceStream = aliceCanvas.captureStream(18);
    const bobStream = bobCanvas.captureStream(8);
    const carlaStream = carlaCanvas.captureStream(18);
    const presStream = screenCanvas.captureStream(20);

    setStreams({
      aliceWebcam: aliceStream,
      bobWebcam: bobStream,
      carlaWebcam: carlaStream,
      presentation: presStream,
    });

    return () => {
      cancelAnimationFrame(raf);
      [aliceStream, bobStream, carlaStream, presStream].forEach((s) => {
        try {
          s.getTracks().forEach((tr) => tr.stop());
        } catch {
          /* ignore */
        }
      });
      setStreams({ aliceWebcam: null, bobWebcam: null, carlaWebcam: null, presentation: null });
    };
  }, []);

  return streams;
}
