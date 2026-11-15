"use client";
import { useEffect, useRef, useState } from "react";
import { Marco, MON, useEscalaX } from "./Marco";
import { co2Horas } from "@/lib/simulado";
import { UMBRALES } from "@/lib/analysis";

export default function MonitorCabina({ t, analisis, aid }) {
  const caja = useRef(null);
  const w = useEscalaX(caja);
  const h = 128;
  const media = t.valor;
  const [serie, setSerie] = useState(() => co2Horas(analisis.fecha, aid, media));
  useEffect(() => {
    setSerie(co2Horas(analisis.fecha, aid, media));
    if (media == null) return;
    const id = setInterval(() => setSerie((s) => [...s.slice(1), Math.round(media * (1 + (Math.random() - 0.5) * 0.03))]), 3000);
    return () => clearInterval(id);
  }, [analisis.fecha, aid, media]);
  const C = UMBRALES.cabina;
  const lo = 1500;
  const hi = Math.max(5600, ...serie) + 200;
  const izq = 34;
  const X = (i) => izq + (i / (serie.length - 1)) * (w - izq - 6);
  const Y = (v) => 6 + (1 - (v - lo) / (hi - lo)) * (h - 22);
  const d = serie.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
  const ahora = serie.at(-1);
  const col = media >= C.co2RojoPpm ? MON.rojo : media >= C.co2AtencionPpm ? MON.ambar : MON.grisAzul;
  return (
    <Marco titulo="CO₂ del módulo · 6 h" color={col} valor={media != null ? Number(media).toLocaleString("es-MX") : "—"} unidad="ppm"
      sub={t.cabinaHoy?.temp_c != null ? `${t.cabinaHoy.temp_c} °C · ${t.cabinaHoy.humedad} % humedad` : null}>
      <div ref={caja} className="absolute inset-0">
        <svg width={w} height={h} aria-hidden>
          {[[C.co2AtencionPpm, MON.ambar, "3,500"], [C.co2RojoPpm, MON.rojo, "5,000"]].map(([v, c, txt]) => (
            <g key={v}>
              <line x1={izq} x2={w - 6} y1={Y(v)} y2={Y(v)} stroke={c} strokeDasharray="5 4" strokeOpacity="0.8" />
              <text x={0} y={Y(v) + 3} fill={c} fontSize="10" style={{ fontFamily: "var(--font-mono)" }}>{txt}</text>
            </g>
          ))}
          <path d={`${d} L${X(serie.length - 1)},${h - 16} L${X(0)},${h - 16} Z`} fill={`${MON.grisAzul}14`} />
          <path d={d} fill="none" stroke={MON.grisAzul} strokeWidth="2.2" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 4px ${MON.grisAzul})` }} />
          <circle cx={X(serie.length - 1)} cy={Y(ahora)} r="4" fill="#fff" stroke={col} strokeWidth="2" />
          {[[0, "−6 h"], [serie.length - 1, "ahora"]].map(([i, txt]) => (
            <text key={txt} x={X(i)} y={h - 2} fill={MON.tenue} fontSize="10" textAnchor={i === 0 ? "start" : "end"}>{txt}</text>
          ))}
        </svg>
      </div>
    </Marco>
  );
}
