"use client";

import { useEffect, useRef } from "react";

// 280 nodes: 22 bright (top candidates) + 258 dim (the evaluated pool)
const N_BRIGHT = 22;
const N_DIM = 258;
const N_TOTAL = N_BRIGHT + N_DIM;

type P = {
  x: number; y: number;
  vx: number; vy: number;
  tx: number; ty: number;  // convergence target
  ph: number;              // oscillation phase
  bright: boolean;
  r: number;               // dot radius
  a: number;               // current alpha
};

export default function CandidateNodes() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;

    function resize() {
      W = canvas!.offsetWidth;
      H = canvas!.offsetHeight;
      canvas!.width = W * dpr;
      canvas!.height = H * dpr;
      ctx!.scale(dpr, dpr);
    }
    resize();

    const cx = () => W * 0.5;
    const cy = () => H * 0.46;

    const particles: P[] = Array.from({ length: N_TOTAL }, (_, i) => {
      const bright = i < N_BRIGHT;
      const angle = Math.random() * Math.PI * 2;
      const minR = bright ? H * 0.08 : H * 0.06;
      const maxR = bright ? H * 0.44 : H * 0.48;
      const dist = minR + Math.random() * (maxR - minR);
      const ox = cx() + Math.cos(angle) * dist;
      const oy = cy() + Math.sin(angle) * dist;
      return {
        x: ox, y: oy,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        tx: cx() + (Math.random() - 0.5) * 52,
        ty: cy() + (Math.random() - 0.5) * 40,
        ph: Math.random() * Math.PI * 2,
        bright,
        r: bright ? 1.8 + Math.random() * 0.9 : 0.9 + Math.random() * 0.7,
        a: bright ? 0.70 + Math.random() * 0.3 : 0.13 + Math.random() * 0.17,
      };
    });

    let conv = 0; // 0 = drifting, 1 = fully converged
    let raf = 0;
    const t0 = performance.now();

    function onScroll() {
      const max = window.innerHeight * 0.38;
      conv = Math.min(window.scrollY / max, 1);
    }
    function onResize() {
      resize();
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    function draw(now: number) {
      if (!ctx) return;
      const t = (now - t0) / 1000;
      const c = reduced ? 0 : conv;

      ctx.clearRect(0, 0, W, H);

      // connections between bright nodes once converging
      if (c > 0.3) {
        const lineA = Math.min((c - 0.3) / 0.35, 1) * 0.18;
        const br = particles.filter(p => p.bright);
        for (let i = 0; i < br.length - 1; i++) {
          for (let j = i + 1; j < br.length; j++) {
            const dx = br[i].x - br[j].x;
            const dy = br[i].y - br[j].y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < 90) {
              ctx.beginPath();
              ctx.moveTo(br[i].x, br[i].y);
              ctx.lineTo(br[j].x, br[j].y);
              ctx.strokeStyle = `rgba(255,77,141,${lineA * (1 - d / 90)})`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }
        }
      }

      // central intelligence core
      if (c > 0.5) {
        const coreA = Math.min((c - 0.5) / 0.28, 1) * 0.14;
        const g = ctx.createRadialGradient(cx(), cy(), 0, cx(), cy(), 72);
        g.addColorStop(0, `rgba(255,77,141,${coreA})`);
        g.addColorStop(0.55, `rgba(176,107,255,${coreA * 0.4})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.beginPath();
        ctx.arc(cx(), cy(), 72, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      }

      // update & draw particles
      for (const p of particles) {
        if (!reduced) {
          if (c < 0.06) {
            // gentle drift
            p.x += p.vx + Math.sin(t * 0.37 + p.ph) * 0.11;
            p.y += p.vy + Math.cos(t * 0.29 + p.ph) * 0.11;
            const m = 24;
            if (p.x < m) p.vx = Math.abs(p.vx) * 0.85;
            if (p.x > W - m) p.vx = -Math.abs(p.vx) * 0.85;
            if (p.y < m) p.vy = Math.abs(p.vy) * 0.85;
            if (p.y > H - m) p.vy = -Math.abs(p.vy) * 0.85;
          } else {
            const pull = c * (p.bright ? 0.032 : 0.018);
            const noise = (1 - c) * 0.07;
            p.x += (p.tx - p.x) * pull + Math.sin(t * 0.5 + p.ph) * noise;
            p.y += (p.ty - p.y) * pull + Math.cos(t * 0.4 + p.ph) * noise;
            if (!p.bright) p.a = Math.max(p.a - c * 0.0025, 0.03);
          }
        }

        const glowR = p.r * (p.bright ? 7 : 4);
        const gd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
        if (p.bright) {
          gd.addColorStop(0, `rgba(255,110,160,${p.a * 0.55})`);
          gd.addColorStop(0.4, `rgba(255,77,141,${p.a * 0.15})`);
          gd.addColorStop(1, "rgba(255,77,141,0)");
        } else {
          gd.addColorStop(0, `rgba(155,165,200,${p.a * 0.45})`);
          gd.addColorStop(1, "rgba(140,150,185,0)");
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
        ctx.fillStyle = gd;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.bright
          ? `rgba(255,120,165,${p.a})`
          : `rgba(155,165,200,${p.a * 0.85})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      style={{ opacity: 0.75 }}
      aria-hidden="true"
    />
  );
}
