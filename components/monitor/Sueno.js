"use client";
import { useMemo, useRef } from "react";
import { Marco, MON, useEscalaX } from "./Marco";
import { FASES, hipnograma } from "@/lib/simulado";

const hora = (h) => {
  const x = ((h % 24) + 24) % 24;
  return `${String(Math.floor(x)).padStart(2, "0")}:${String(Math.round((x % 1) * 60)).padStart(2, "0")}`;
};

export default function MonitorSueno({ analisis, data, aid }) {
  const caja = useRef(null);
  const w = useEscalaX(caja);
  const h = 128;
  const horas = data.vitals.at(-1)?.horas_sueno;
  const hip = useMemo(() => hipnograma(analisis.fecha, aid, horas), [analisis.fecha, aid, horas]);
  const izq = 66;
  const X = (i) => izq + (i / hip.epocas.length) * (w - izq - 6);
  const nivel = Object.fromEntries(FASES.map((f) => [f.k, f.nivel]));
  const Y = (n) => 8 + (3 - n) * ((h - 30) / 3);
  let d = "";
  hip.epocas.forEach((e, i) => {
    const y = Y(nivel[e]);
    d += i ? `L${X(i).toFixed(1)},${y}` : `M${X(0)},${y}`;
    d += `L${X(i + 1).toFixed(1)},${y}`;
  });
  return (
    <Marco titulo="Hipnograma · anoche" color={MON.azul} etiquetaVivo="ANOCHE" valor={horas ?? "—"} unidad="h" sub={`${hora(hip.inicio)} → ${hora(hip.fin)}`}>
      <div ref={caja} className="absolute inset-0">
        <svg width={w} height={h} aria-hidden>
          {FASES.map((f) => (
            <g key={f.k}>
              <line x1={izq} x2={w - 6} y1={Y(f.nivel)} y2={Y(f.nivel)} stroke={MON.rejilla} />
              <text x={0} y={Y(f.nivel) + 3} fill={f.color} fontSize="10">{f.nombre}</text>
            </g>
          ))}
          <path d={d} pathLength={1} className="trazo" fill="none" stroke={MON.azul} strokeWidth="2.2" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 5px ${MON.azul})` }} />
          {[0, Math.floor(hip.epocas.length / 2), hip.epocas.length].map((i) => (
            <text key={i} x={X(i)} y={h - 2} fill={MON.tenue} fontSize="10" textAnchor={i === 0 ? "start" : i === hip.epocas.length ? "end" : "middle"}>{hora(hip.inicio + i / 4)}</text>
          ))}
        </svg>
      </div>
    </Marco>
  );
}
