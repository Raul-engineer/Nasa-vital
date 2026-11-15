"use client";
import { useEffect, useRef, useState } from "react";

export const MON = {
  fondo: "#040b17",
  borde: "#1e3a5f",
  rejilla: "rgba(34,211,238,0.07)",
  texto: "#e6f0ff",
  tenue: "#7d93b8",
  verde: "#4ade80",
  cian: "#22d3ee",
  amarillo: "#facc15",
  rojo: "#f87171",
  naranja: "#fb923c",
  blanco: "#f1f5f9",
  morado: "#c084fc",
  azul: "#60a5fa",
  lila: "#c4b5fd",
  verdeClaro: "#86efac",
  grisAzul: "#94a3b8",
  ambar: "#fbbf24",
};

export function useMovimientoReducido() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const f = () => setR(m.matches);
    f();
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, []);
  return r;
}

export function Marco({ titulo, color, valor, unidad, sub, extra, children, etiquetaVivo = "EN VIVO", alto = 176 }) {
  return (
    <section data-theme="dark" aria-label={`Monitor: ${titulo}`}
      className="relative overflow-hidden rounded-2xl border"
      style={{ background: `radial-gradient(600px 200px at 20% 0%, ${color}12, transparent 70%), ${MON.fondo}`, borderColor: MON.borde, color: MON.texto }}>
      <div className="grid gap-0 sm:grid-cols-[minmax(0,1fr)_200px]" style={{ minHeight: alto }}>
        <div className="relative min-w-0 p-3">
          <div className="mb-1 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 motion-reduce:hidden" style={{ background: color }} />
              <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: color }} />
            </span>
            <span className="text-[10px] font-semibold tracking-[0.18em]" style={{ color: MON.tenue }}>{etiquetaVivo} · {titulo.toUpperCase()}</span>
          </div>
          <div className="relative" style={{ height: alto - 44 }}>{children}</div>
        </div>
        <div className="flex flex-col justify-center gap-1 border-t px-4 py-3 sm:border-l sm:border-t-0" style={{ borderColor: MON.borde }}>
          <div className="num text-5xl font-semibold leading-none" style={{ color, textShadow: `0 0 18px ${color}66` }}>
            {valor}
            {unidad && <span className="ml-1 text-base font-normal" style={{ color: MON.tenue }}>{unidad}</span>}
          </div>
          {sub && <div className="text-xs" style={{ color: MON.tenue }}>{sub}</div>}
          {extra}
        </div>
      </div>
    </section>
  );
}

export function OndaCanvas({ generar, color, pxPorSeg = 110, grosor = 2.2, rango = [-1, 1] }) {
  const ref = useRef(null);
  const gen = useRef(generar);
  const rg = useRef(rango);
  gen.current = generar;
  rg.current = rango;
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, dpr = 1, raf = 0, last = performance.now(), acum = 0;
    let buf = [];
    const llenar = (n) => {
      const out = [];
      for (let i = 0; i < n; i++) out.push(gen.current(1 / pxPorSeg));
      return out;
    };
    const medir = () => {
      dpr = window.devicePixelRatio || 1;
      w = cv.clientWidth;
      h = cv.clientHeight;
      cv.width = Math.max(1, Math.round(w * dpr));
      cv.height = Math.max(1, Math.round(h * dpr));
      const n = Math.max(2, Math.ceil(w));
      buf = buf.length >= n ? buf.slice(-n) : [...llenar(n - buf.length), ...buf];
      if (reducido) dibujar();
    };
    const dibujar = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = MON.rejilla;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < w; x += 24) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); }
      for (let y = 0; y < h; y += 24) { ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); }
      ctx.stroke();
      const [lo, hi] = rg.current;
      const Y = (v) => h - 8 - ((v - lo) / (hi - lo)) * (h - 16);
      ctx.beginPath();
      buf.forEach((v, i) => (i ? ctx.lineTo(i, Y(v)) : ctx.moveTo(i, Y(v))));
      ctx.strokeStyle = color;
      ctx.lineWidth = grosor;
      ctx.lineJoin = "round";
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;
      const gx = ctx.createLinearGradient(0, 0, w * 0.25, 0);
      gx.addColorStop(0, MON.fondo);
      gx.addColorStop(1, "rgba(4,11,23,0)");
      ctx.fillStyle = gx;
      ctx.fillRect(0, 0, w * 0.25, h);
      const yv = Y(buf[buf.length - 1]);
      ctx.beginPath();
      ctx.arc(w - 2, yv, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
    };
    const frame = (t) => {
      const dt = Math.min(0.1, (t - last) / 1000);
      last = t;
      acum += dt * pxPorSeg;
      const n = Math.floor(acum);
      if (n > 0) {
        acum -= n;
        buf = [...buf.slice(n), ...llenar(n)];
      }
      dibujar();
      raf = requestAnimationFrame(frame);
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(cv);
    if (reducido) dibujar();
    else raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [color, pxPorSeg, grosor]);
  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden />;
}

export function useEscalaX(ref) {
  const [w, setW] = useState(600);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth || 600));
    ro.observe(el);
    setW(el.clientWidth || 600);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

export function Semicirculo({ pct, color, etiqueta, valor, size = 112 }) {
  const r = size / 2 - 8;
  const cx = size / 2;
  const cy = size / 2;
  const largo = Math.PI * r;
  const p = Math.max(0, Math.min(1, pct || 0));
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 8} aria-hidden>
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth="9" strokeLinecap="round" />
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
          strokeDasharray={largo} strokeDashoffset={largo * (1 - p)} style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: "stroke-dashoffset 1s ease" }} />
        <text x={cx} y={cy - 4} textAnchor="middle" fill={MON.texto} fontSize="17" fontWeight="600" style={{ fontFamily: "var(--font-mono)" }}>{Math.round(p * 100)}%</text>
      </svg>
      <div className="text-[10px] font-semibold tracking-[0.14em]" style={{ color: MON.tenue }}>{etiqueta}</div>
      {valor && <div className="num text-[11px]" style={{ color: MON.tenue }}>{valor}</div>}
    </div>
  );
}
