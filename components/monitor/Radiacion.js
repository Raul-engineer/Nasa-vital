"use client";
import { useEffect, useRef, useState } from "react";
import { Marco, MON, Semicirculo } from "./Marco";
import { UMBRALES } from "@/lib/analysis";

function Geiger({ tasa, color }) {
  const ref = useRef(null);
  const tRef = useRef(tasa);
  tRef.current = tasa;
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const n = 48;
    const barras = Array.from({ length: n }, () => 0.1 + Math.random() * 0.6);
    let raf = 0;
    let last = performance.now();
    const dibujar = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = cv.clientWidth;
      const h = cv.clientHeight;
      if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
        cv.width = Math.max(1, Math.round(w * dpr));
        cv.height = Math.max(1, Math.round(h * dpr));
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const bw = w / n;
      barras.forEach((b, i) => {
        const bh = Math.max(2, b * h);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.25 + b * 0.75;
        ctx.shadowColor = color;
        ctx.shadowBlur = b > 0.6 ? 8 : 0;
        ctx.fillRect(i * bw + 1, h - bh, Math.max(1, bw - 2), bh);
      });
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    };
    const frame = (t) => {
      const dt = Math.min(0.1, (t - last) / 1000);
      last = t;
      const clics = Math.min(60, 2 + (tRef.current || 0) / 6);
      for (let i = 0; i < n; i++) barras[i] = Math.max(0.06, barras[i] - dt * 1.1);
      let k = clics * dt;
      while (k > 0) {
        if (Math.random() < Math.min(1, k)) barras[Math.floor(Math.random() * n)] = 0.5 + Math.random() * 0.5;
        k -= 1;
      }
      dibujar();
      raf = requestAnimationFrame(frame);
    };
    if (reducido) dibujar();
    else raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [color]);
  return <canvas ref={ref} className="h-full w-full" aria-hidden />;
}

export default function MonitorRadiacion({ analisis }) {
  const r = analisis.radiacion;
  const tormenta = !!r.activo;
  const color = tormenta ? MON.rojo : MON.morado;
  const [lectura, setLectura] = useState({ v: r.tasa, n: 0 });
  useEffect(() => {
    setLectura((l) => ({ v: r.tasa, n: l.n + 1 }));
    const t = setInterval(() => setLectura((l) => ({ v: r.tasa * (1 + (Math.random() - 0.5) * 0.06), n: l.n + 1 })), 1800);
    return () => clearInterval(t);
  }, [r.tasa]);
  const R = UMBRALES.radiacion;
  const colPct = (p) => (tormenta || p >= R.criticoPct ? MON.rojo : p >= R.atencionPct ? MON.ambar : color);
  return (
    <Marco titulo={tormenta ? `Dosimeter · storm ${r.activo.nivel}` : "Personal dosimeter"} color={color}
      valor={<span key={lectura.n} className="parpadeo inline-block">{Math.round(r.tasa)}</span>} unidad="µSv/h"
      sub={`Today ${r.hoy.toFixed(2)} mSv · baseline ${Math.round(r.tasaBase)} µSv/h`}>
      <div className="grid h-full grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="relative min-h-[60px] rounded-xl border p-2" style={{ borderColor: `${color}44`, background: tormenta ? `${MON.rojo}14` : "transparent" }}>
          <div className="absolute left-2 top-1 text-[9px] tracking-[0.16em]" style={{ color: MON.tenue }}>COUNTER</div>
          <div className="absolute inset-x-2 bottom-2 top-5"><Geiger tasa={lectura.v} color={color} /></div>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Semicirculo pct={r.pct} color={colPct(r.pct)} etiqueta="CAREER" valor={`${Math.round(r.carrera)} / ${R.limiteCarrera} mSv`} />
          <Semicirculo pct={r.pct30} color={colPct(r.pct30)} etiqueta="30 DAYS" valor={`${Math.round(r.ventana30)} / ${R.limite30d} mSv`} />
        </div>
      </div>
    </Marco>
  );
}
