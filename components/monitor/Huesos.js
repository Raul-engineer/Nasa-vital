"use client";
import { useRef } from "react";
import { Marco, MON, useEscalaX } from "./Marco";

const DIA = ["D", "L", "M", "M", "J", "V", "S"];

export function ejercicioDia(v) {
  const total = Number(v.minutos_ejercicio) || 0;
  const fuerza = v.ejercicio_fuerza_min != null ? Number(v.ejercicio_fuerza_min) : Math.round(total * 0.55);
  const cardio = v.ejercicio_cardio_min != null ? Number(v.ejercicio_cardio_min) : total - fuerza;
  return { fuerza, cardio, total: fuerza + cardio };
}

export default function MonitorHuesos({ data, t }) {
  const caja = useRef(null);
  const w = useEscalaX(caja);
  const h = 128;
  const presc = t.prescrito || 120;
  const dias = data.vitals.slice(-7).map((v) => ({ fecha: v.fecha, dia: DIA[new Date(v.fecha + "T12:00:00").getDay()], ...ejercicioDia(v) }));
  const max = Math.max(presc * 1.3, ...dias.map((d) => d.total));
  const base = h - 16;
  const Y = (m) => base - (m / max) * (base - 14);
  const paso = (w - 10) / dias.length;
  const bw = Math.min(34, paso * 0.55);
  return (
    <Marco titulo="Ejercicio · 7 días" color={MON.verdeClaro} etiquetaVivo="ACTIVIDAD" valor={t.valor ?? "—"} unidad="%"
      sub={<span className="flex gap-3"><span style={{ color: MON.verdeClaro }}>■ Fuerza</span><span style={{ color: MON.cian }}>■ Cardio</span></span>}>
      <div ref={caja} className="absolute inset-0">
        <svg width={w} height={h} aria-hidden>
          {dias.map((d, i) => {
            const x = 5 + paso * i + (paso - bw) / 2;
            return (
              <g key={d.fecha} style={i === dias.length - 1 ? { filter: `drop-shadow(0 0 6px ${MON.verdeClaro})` } : undefined}>
                <rect x={x} y={Y(d.fuerza)} width={bw} height={base - Y(d.fuerza)} rx="3" fill={MON.verdeClaro} />
                <rect x={x} y={Y(d.total)} width={bw} height={Y(d.fuerza) - Y(d.total)} rx="3" fill={MON.cian} />
                <text x={x + bw / 2} y={Y(d.total) - 3} fill={d.total < presc ? MON.ambar : MON.texto} fontSize="10" textAnchor="middle" style={{ fontFamily: "var(--font-mono)" }}>{d.total}</text>
                <text x={x + bw / 2} y={h - 2} fill={MON.tenue} fontSize="10" textAnchor="middle">{d.dia}</text>
              </g>
            );
          })}
          <line x1={0} x2={w} y1={Y(presc)} y2={Y(presc)} stroke={MON.ambar} strokeWidth="1.6" strokeDasharray="6 4" />
          <text x={w - 2} y={Y(presc) - 4} fill={MON.ambar} fontSize="10" textAnchor="end">{presc} min prescritos</text>
        </svg>
      </div>
    </Marco>
  );
}
