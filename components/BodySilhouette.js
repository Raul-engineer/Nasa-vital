"use client";
import { useEffect, useRef, useState } from "react";
import { ESTADO } from "./Shell";

const RIGHT = [
  [100, 68], [109, 69], [112, 80], [128, 84], [142, 90], [151, 104], [155, 140], [160, 190], [163, 226],
  [168, 246], [161, 254], [153, 236], [149, 196], [143, 150], [138, 122], [135, 160], [129, 200],
  [136, 236], [136, 290], [130, 330], [128, 375], [124, 400], [134, 412], [108, 414], [108, 380],
  [111, 330], [107, 262], [100, 252],
];

function catmull(points) {
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const t = 0.18;
    const c1 = [p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t];
    const c2 = [p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0]},${p2[1]}`;
  }
  return d + " Z";
}
const LEFT = RIGHT.slice(1, -1).map(([x, y]) => [200 - x, y]).reverse();
const BODY = catmull([...RIGHT, ...LEFT]);

const W = 400;
const H = 470;
const OX = 100;
const OY = 22;
const CX = OX + 100;

export const PUNTOS_CUERPO = {
  fc: [93, 74],
  pa: [54, 126],
  fr: [86, 150],
  spo2: [34, 246],
  temp: [107, 24],
  conciencia: [119, 42],
  sueno: [123, 62],
  animo: [114, 120],
};

function useGeometria(activo) {
  const ref = useRef(null);
  const [geo, setGeo] = useState(null);
  useEffect(() => {
    const el = ref.current;
    if (!activo || !el) return;
    const medir = () => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const s = Math.min(r.width / W, r.height / H);
      setGeo({ halfW: r.width / (2 * s), offY: (r.height - H * s) / 2, s, h: r.height });
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [activo]);
  return [ref, geo];
}

export default function BodySilhouette({ puntos = [], seleccionado, onSelect, conectores, aura = "normal" }) {
  const colAura = aura === "normal" ? "var(--color-violet)" : ESTADO[aura].hex;
  const [ref, geo] = useGeometria(!!conectores);
  const filas = {};
  if (conectores && geo) {
    for (const lado of ["izq", "der"]) {
      const lista = conectores[lado] || [];
      lista.forEach((k, j) => {
        const frac = (2 * j + 1) / (2 * lista.length);
        filas[k] = { lado, y: (frac * geo.h - geo.offY) / geo.s, x: lado === "izq" ? CX - geo.halfW + 1 : CX + geo.halfW - 1 };
      });
    }
  }
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="h-full w-full overflow-visible" role="img" aria-label="Silueta del cuerpo con tus signos vitales">
      <defs>
        <radialGradient id="bs-aura" cx="50%" cy="45%" r="55%">
          <stop offset="0%" style={{ stopColor: colAura, stopOpacity: aura === "critico" ? 0.45 : 0.22 }} />
          <stop offset="100%" style={{ stopColor: colAura, stopOpacity: 0 }} />
        </radialGradient>
        <linearGradient id="bs-anillo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" style={{ stopColor: "var(--color-violet)", stopOpacity: 0.55 }} />
          <stop offset="50%" style={{ stopColor: "var(--color-violet)", stopOpacity: 0.15 }} />
          <stop offset="100%" style={{ stopColor: "var(--color-violet)", stopOpacity: 0.55 }} />
        </linearGradient>
        <linearGradient id="bs-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: "var(--color-violet)", stopOpacity: 0.35 }} />
          <stop offset="100%" style={{ stopColor: "var(--color-violet)", stopOpacity: 0.14 }} />
        </linearGradient>
        <linearGradient id="bs-scan" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: "var(--color-violet)", stopOpacity: 0 }} />
          <stop offset="50%" style={{ stopColor: "var(--color-violet)", stopOpacity: 0.5 }} />
          <stop offset="100%" style={{ stopColor: "var(--color-violet)", stopOpacity: 0 }} />
        </linearGradient>
        <filter id="bs-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <clipPath id="bs-clip">
          <circle cx={CX} cy={OY + 42} r="24" />
          <path d={BODY} transform={`translate(${OX},${OY})`} />
        </clipPath>
      </defs>

      <circle cx={CX} cy={OY + 214} r="206" fill="url(#bs-aura)">
        {aura === "critico" && <animate attributeName="opacity" values="1;0.45;1" dur="1.6s" repeatCount="indefinite" />}
      </circle>
      <circle cx={CX} cy={OY + 214} r="196" fill="none" stroke="url(#bs-anillo)" strokeWidth="1.5" />
      <g className="giro-lento">
        <circle cx={CX} cy={OY + 214} r="172" fill="none" style={{ stroke: "var(--color-violet)" }} strokeOpacity="0.28" strokeDasharray="2 10" />
      </g>
      <circle cx={CX} cy={OY + 214} r="146" fill="none" style={{ stroke: "var(--color-violet)" }} strokeOpacity="0.14" />

      <ellipse cx={CX} cy={OY + 425} rx="95" ry="16" fill="none" style={{ stroke: "var(--color-violet)" }} strokeOpacity="0.45" />
      <ellipse cx={CX} cy={OY + 425} rx="65" ry="10" fill="none" style={{ stroke: "var(--color-violet)" }} strokeOpacity="0.8" filter="url(#bs-glow)" />

      <g filter="url(#bs-glow)">
        <circle cx={CX} cy={OY + 42} r="24" fill="url(#bs-fill)" style={{ stroke: "var(--color-violet)" }} strokeWidth="1.5" />
        <path d={BODY} transform={`translate(${OX},${OY})`} fill="url(#bs-fill)" style={{ stroke: "var(--color-violet)" }} strokeWidth="1.5" />
      </g>
      <g clipPath="url(#bs-clip)">
        <rect x={OX} y={OY} width="200" height="40" fill="url(#bs-scan)">
          <animate attributeName="y" values={`${OY - 40};${OY + 420};${OY - 40}`} dur="6s" repeatCount="indefinite" />
        </rect>
      </g>

      {puntos.map(({ k, estado = "normal", fuera, nombre }) => {
        const b = PUNTOS_CUERPO[k];
        if (!b) return null;
        const bx = OX + b[0];
        const by = OY + b[1];
        const col = estado === "normal" ? "var(--color-violet)" : ESTADO[estado].hex;
        const sel = seleccionado === k;
        const f = filas[k];
        const codoX = f ? (f.lado === "izq" ? OX + 4 : OX + 196) : 0;
        return (
          <g key={k} className="cursor-pointer outline-none" onClick={() => onSelect?.(k)} role="button" aria-label={nombre} tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect?.(k)}>
            {f && (
              <>
                <path d={`M${bx},${by} L${codoX},${f.y} L${f.x},${f.y}`} fill="none" style={{ stroke: col }} strokeOpacity={sel ? 0.95 : 0.4}
                  strokeWidth={sel ? 1.6 : 1} strokeDasharray="3 4" />
                <circle cx={f.x} cy={f.y} r="2.5" style={{ fill: col }} opacity={sel ? 1 : 0.6} />
              </>
            )}
            <circle cx={bx} cy={by} r="16" fill="transparent" />
            {(fuera || sel) && (
              <circle cx={bx} cy={by} r="9" fill="none" style={{ stroke: col }} strokeOpacity="0.6">
                <animate attributeName="r" values="7;13;7" dur="1.8s" repeatCount="indefinite" />
                <animate attributeName="stroke-opacity" values="0.7;0;0.7" dur="1.8s" repeatCount="indefinite" />
              </circle>
            )}
            <circle cx={bx} cy={by} r={sel ? 6.5 : 5} style={{ fill: col }} filter="url(#bs-glow)" />
            <title>{nombre}</title>
          </g>
        );
      })}
    </svg>
  );
}
