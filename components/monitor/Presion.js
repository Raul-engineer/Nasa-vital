"use client";
import { useEffect, useRef, useState } from "react";
import { Marco, MON } from "./Marco";
import { medirPresion } from "@/lib/data";
import CyberButton from "@/components/CyberButton";

const hhmm = (d) => d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });

export function medicionesPresion(data) {
  const diarias = data.vitals.filter((v) => v.sistolica != null).map((v) => ({ fecha: new Date(v.fecha + "T07:00:00"), sis: Number(v.sistolica), dia: Number(v.diastolica), origen: "diaria" }));
  const manuales = (data.pruebas || []).filter((p) => p.tipo === "presion" && p.resultado?.sistolica != null)
    .map((p) => ({ fecha: new Date(p.creada_en || p.fecha + "T12:00:00"), sis: Number(p.resultado.sistolica), dia: Number(p.resultado.diastolica), origen: "brazalete" }));
  return [...diarias, ...manuales].sort((a, b) => a.fecha - b.fecha);
}

export default function MonitorPresion({ data, analisis, aid }) {
  const [inflando, setInflando] = useState(false);
  const [pct, setPct] = useState(0);
  const raf = useRef(0);
  const med = medicionesPresion(data);
  const ult = med.at(-1);
  const seis = med.slice(-6);
  const media = ult ? Math.round(ult.dia + (ult.sis - ult.dia) / 3) : null;
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  const medir = () => {
    if (inflando) return;
    setInflando(true);
    const t0 = performance.now();
    const paso = (t) => {
      const p = Math.min(1, (t - t0) / 3000);
      setPct(p);
      if (p < 1) {
        raf.current = requestAnimationFrame(paso);
        return;
      }
      const base = data.vitals.at(-1) || {};
      const e = analisis.efecto || { sistolica: 0, diastolica: 0 };
      const sis = Math.round((Number(base.sistolica) || 115) + (Math.random() - 0.5) * 8 + e.sistolica);
      const dia = Math.round((Number(base.diastolica) || 72) + (Math.random() - 0.5) * 6 + e.diastolica);
      medirPresion(aid, sis, dia).finally(() => {
        setInflando(false);
        setPct(0);
      });
    };
    raf.current = requestAnimationFrame(paso);
  };
  const lo = 50;
  const hi = 170;
  const Y = (v) => 100 - ((v - lo) / (hi - lo)) * 100;
  return (
    <Marco titulo="Presión · brazalete" color={MON.rojo} etiquetaVivo="ÚLTIMA MEDICIÓN"
      valor={ult ? `${ult.sis}/${ult.dia}` : "—"} unidad="mmHg"
      sub={ult ? `Media ${media} · ${hhmm(ult.fecha)}${ult.fecha.toDateString() !== new Date().toDateString() ? ` · ${ult.fecha.toLocaleDateString("es-MX", { day: "numeric", month: "short" })}` : ""}` : null}
      extra={
        <div className="mt-2">
          <CyberButton onClick={medir} disabled={inflando} className="w-full" atajo="↵" texto={inflando ? "Inflando…" : "Medir ahora"}>
            {inflando ? "Inflando…" : "Medir ahora"}
          </CyberButton>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full" style={{ background: "rgba(148,163,184,0.18)" }} role="progressbar" aria-valuenow={Math.round(pct * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Inflado del brazalete">
            <div className="h-full rounded-full" style={{ width: `${pct * 100}%`, background: MON.rojo, boxShadow: `0 0 8px ${MON.rojo}` }} />
          </div>
        </div>
      }>
      <div className="flex h-full items-stretch gap-2 sm:gap-4">
        <div className="relative flex-1">
          {[140, 120, 90, 60].map((v) => (
            <div key={v} className="absolute left-0 right-0 border-t border-dashed" style={{ top: `${Y(v)}%`, borderColor: v === 140 ? `${MON.rojo}55` : "rgba(148,163,184,0.15)" }}>
              <span className="num absolute -top-2 left-0 text-[9px]" style={{ color: MON.tenue }}>{v}</span>
            </div>
          ))}
          <div className="absolute inset-0 flex items-stretch justify-around pl-7">
            {seis.map((m, i) => (
              <div key={i} className="relative flex w-8 flex-col items-center">
                <div className="absolute w-2.5 rounded-full" style={{ top: `${Y(m.sis)}%`, height: `${Y(m.dia) - Y(m.sis)}%`, background: i === seis.length - 1 ? MON.rojo : `${MON.rojo}88`, boxShadow: i === seis.length - 1 ? `0 0 10px ${MON.rojo}` : "none" }} />
                <span className="num absolute text-[10px]" style={{ top: `calc(${Y(m.sis)}% - 15px)`, color: MON.texto }}>{m.sis}</span>
                <span className="num absolute text-[10px]" style={{ top: `calc(${Y(m.dia)}% + 2px)`, color: MON.tenue }}>{m.dia}</span>
                <span className="absolute -bottom-0.5 text-[9px]" style={{ color: MON.tenue }}>{m.origen === "brazalete" ? hhmm(m.fecha) : m.fecha.toLocaleDateString("es-MX", { day: "numeric", month: "short" })}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Marco>
  );
}
