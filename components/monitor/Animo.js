"use client";
import { useRef } from "react";
import { Marco, MON, useEscalaX } from "./Marco";

export default function MonitorAnimo({ data, analisis, t }) {
  const caja = useRef(null);
  const w = useEscalaX(caja);
  const h = 128;
  const porFecha = new Map(data.checkins.map((c) => [c.fecha, c]));
  const dias = data.vitals.slice(-14).map((v) => {
    const c = v.fecha === analisis.fecha ? analisis.checkinHoy : porFecha.get(v.fecha) || {};
    return { fecha: v.fecha, animo: c.animo != null ? Number(c.animo) : null, estres: c.estres != null ? Number(c.estres) : null };
  });
  const izq = 22;
  const X = (i) => izq + 8 + (i / (dias.length - 1)) * (w - izq - 20);
  const Y = (v) => 8 + (1 - (v - 1) / 4) * (h - 30);
  const linea = (k) => dias.map((d, i) => (d[k] == null ? "" : `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(d[k]).toFixed(1)}`)).join(" ");
  return (
    <Marco titulo="Ánimo y estrés · 14 días" color={MON.lila} etiquetaVivo="CHECK-IN" valor={t.valor ?? "—"} unidad="WHO-5"
      sub={<span className="flex gap-3"><span style={{ color: MON.lila }}>● Ánimo</span><span style={{ color: MON.ambar }}>○ Estrés</span></span>}>
      <div ref={caja} className="absolute inset-0">
        <svg width={w} height={h} aria-hidden>
          {[1, 3, 5].map((v) => (
            <g key={v}>
              <line x1={izq} x2={w - 6} y1={Y(v)} y2={Y(v)} stroke={MON.rejilla} />
              <text x={0} y={Y(v) + 3} fill={MON.tenue} fontSize="10" style={{ fontFamily: "var(--font-mono)" }}>{v}</text>
            </g>
          ))}
          <path d={linea("animo")} fill="none" stroke={`${MON.lila}55`} strokeWidth="1.5" />
          <path d={linea("estres")} fill="none" stroke={`${MON.ambar}44`} strokeWidth="1.5" strokeDasharray="3 3" />
          {dias.map((d, i) => (
            <g key={d.fecha}>
              {d.animo != null && <circle cx={X(i)} cy={Y(d.animo)} r={i === dias.length - 1 ? 6 : 4.5} fill={MON.lila} style={{ filter: `drop-shadow(0 0 4px ${MON.lila})` }} />}
              {d.estres != null && <circle cx={X(i)} cy={Y(d.estres)} r="4" fill={MON.fondo} stroke={MON.ambar} strokeWidth="2" />}
            </g>
          ))}
          {[[0, "−14 d"], [dias.length - 1, "hoy"]].map(([i, txt]) => (
            <text key={txt} x={X(i)} y={h - 2} fill={MON.tenue} fontSize="10" textAnchor={i === 0 ? "start" : "end"}>{txt}</text>
          ))}
        </svg>
      </div>
    </Marco>
  );
}
