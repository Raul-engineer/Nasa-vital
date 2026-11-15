"use client";
import { useMemo, useRef } from "react";
import { Marco, MON, useEscalaX } from "./Marco";
import { temperatura24 } from "@/lib/simulado";

export default function MonitorTemperatura({ analisis, data, aid }) {
  const caja = useRef(null);
  const w = useEscalaX(caja);
  const h = 128;
  const actual = analisis.hoy.temperatura;
  const reposo = data.vitals.at(-1)?.temperatura;
  const puntos = useMemo(() => temperatura24(analisis.fecha, aid, reposo, actual), [analisis.fecha, aid, reposo, actual]);
  const lo = 35.5, hi = 39.5;
  const X = (i) => 28 + (i / (puntos.length - 1)) * (w - 36);
  const Y = (v) => 6 + (1 - (v - lo) / (hi - lo)) * (h - 22);
  const d = puntos.map((p, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(p.v).toFixed(1)}`).join(" ");
  const ult = puntos.at(-1);
  return (
    <Marco titulo="Temperatura · 24 h" color={MON.naranja} valor={actual != null ? Number(actual).toFixed(1) : "—"} unidad="°C" sub="Banda normal 36.1–38.0">
      <div ref={caja} className="absolute inset-0">
        <svg width={w} height={h} aria-hidden>
          <rect x={28} y={Y(38)} width={w - 36} height={Y(36.1) - Y(38)} fill={`${MON.verde}12`} stroke={`${MON.verde}55`} strokeDasharray="4 4" />
          {[36, 37, 38, 39].map((v) => (
            <g key={v}>
              <line x1={28} x2={w - 8} y1={Y(v)} y2={Y(v)} stroke={MON.rejilla} />
              <text x={0} y={Y(v) + 3} fill={MON.tenue} fontSize="10" style={{ fontFamily: "var(--font-mono)" }}>{v}°</text>
            </g>
          ))}
          <path key={`${actual}`} d={d} pathLength={1} className="trazo" fill="none" stroke={MON.naranja} strokeWidth="2.4" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 5px ${MON.naranja})` }} />
          <circle cx={X(puntos.length - 1)} cy={Y(ult.v)} r="4" fill="#fff" stroke={MON.naranja} strokeWidth="2" className="motion-safe:animate-pulse" />
          {[[0, "−24 h"], [12, "−12 h"], [24, "ahora"]].map(([i, txt]) => (
            <text key={txt} x={X(i)} y={h - 2} fill={MON.tenue} fontSize="10" textAnchor={i === 0 ? "start" : i === 24 ? "end" : "middle"}>{txt}</text>
          ))}
        </svg>
      </div>
    </Marco>
  );
}
