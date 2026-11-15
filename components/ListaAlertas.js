"use client";
import { useEffect, useState } from "react";
import CyberButton from "./CyberButton";
import { COLOR_GRAVEDAD, ORDEN_GRAVEDAD } from "@/lib/analysis";

const CORTO = { fc: "HR", pa: "Pressure", fr: "RR", temp: "Temperature", spo2: "SpO₂", conciencia: "Consciousness", radiacion: "Radiation", vision: "Vision", huesos: "Bones", cabina: "CO₂", sueno: "Sleep", animo: "Mood" };
const UNIDAD = { fc: "bpm", pa: "", fr: "br/min", temp: "°C", spo2: "%", conciencia: "", radiacion: "µSv/h", vision: "", huesos: "%", cabina: "ppm", sueno: "h", animo: "/100" };
const TOOLTIP_VIDA = "Guidance indicator calculated from your active alerts. It is not a diagnosis.";
const memoria = {};

const llave = (aid) => `quickfix_alertas_${aid}`;
function registro(aid) {
  if (memoria[aid]) return memoria[aid];
  let r = {};
  try {
    r = JSON.parse(localStorage.getItem(llave(aid))) || {};
  } catch {}
  memoria[aid] = r;
  return r;
}

export function valorCorto(t) {
  if (t.k === "conciencia") return `Consciousness: ${t.estado === "normal" ? t.texto : t.etiqueta}`;
  return `${CORTO[t.k] || t.nombre} ${t.texto}${UNIDAD[t.k] ? ` ${UNIDAD[t.k]}` : ""}`;
}

function frase(texto) {
  const p = String(texto || "").split(/\s+/).filter(Boolean);
  return p.length > 6 ? `${p.slice(0, 5).join(" ")}…` : p.join(" ");
}

export function useAlertasActivas(analisis, aid) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 30000);
    return () => clearInterval(t);
  }, []);
  const items = [];
  let firma = "";
  if (analisis && aid != null && typeof window !== "undefined") {
    const reg = registro(aid);
    const ahora = Date.now();
    for (const t of analisis.tarjetas) {
      const g = analisis.gravedades?.[t.k] || "ok";
      if (g === "ok") {
        delete reg[t.k];
        continue;
      }
      if (!reg[t.k]) {
        const dias = analisis.diasAlerta?.[t.k] || 1;
        const manana = new Date();
        manana.setHours(8, 0, 0, 0);
        reg[t.k] = { desde: dias > 1 ? manana.getTime() - (dias - 1) * 864e5 : ahora };
      }
      items.push({ k: t.k, nivel: g, t, desde: reg[t.k].desde, frase: frase(analisis.interpretaciones?.[t.k]?.conclusion || t.motivo || t.nombre) });
    }
    items.sort((a, b) => ORDEN_GRAVEDAD[a.nivel] - ORDEN_GRAVEDAD[b.nivel] || b.desde - a.desde);
    firma = JSON.stringify(reg);
  }
  useEffect(() => {
    if (!firma) return;
    try {
      localStorage.setItem(llave(aid), firma);
    } catch {}
  }, [aid, firma]);
  return items;
}

export const FILTROS = ["critico", "urgente", "moderado", "info"];
const NOMBRE_BOTON = { critico: "Critical", urgente: "Urgent", moderado: "Moderate", info: "Exertion" };

export function BotonesGravedad({ items, filtro, onFiltro }) {
  if (!items.length)
    return (
      <div className="flex justify-end" data-botones-gravedad data-sin-alertas>
        <span className="inline-flex items-center gap-2 rounded-full border border-ok/50 bg-ok/10 px-4 py-2 text-sm font-semibold text-ok">
          <span aria-hidden>✓</span> No alerts · all stable
        </span>
      </div>
    );
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1 min-[900px]:justify-end" role="group" aria-label="Filter alerts by severity" data-botones-gravedad>
      {FILTROS.map((f) => {
        const n = items.filter((a) => a.nivel === f).length;
        const activo = filtro === f;
        const atenuado = !n || (filtro && !activo);
        return (
          <CyberButton key={f} onClick={() => onFiltro(activo ? null : f)} disabled={!n} activo={activo} atajo={n} texto={NOMBRE_BOTON[f]}
            className={`cyber-color shrink-0 ${atenuado ? "cyber-atenuado" : ""}`} style={{ "--c": COLOR_GRAVEDAD[f] }}
            aria-pressed={activo} aria-label={`${NOMBRE_BOTON[f]}: ${n} ${n === 1 ? "alert" : "alerts"}`} data-filtro={f} data-cuenta={n}>
            {NOMBRE_BOTON[f]}
          </CyberButton>
        );
      })}
    </div>
  );
}

export function BarraVida({ salud }) {
  if (!salud) return null;
  const critico = salud.clave === "critico";
  return (
    <div className="mx-auto flex w-[50%] min-w-[280px] items-center gap-3 rounded-full border border-white/12 bg-black/25 px-4 py-2 text-[15px] backdrop-blur-sm" title={TOOLTIP_VIDA}
      role="meter" aria-label="Health" aria-valuemin={0} aria-valuemax={100} aria-valuenow={salud.valor} aria-valuetext={salud.palabra} data-salud={salud.clave}>
      <span className="flex shrink-0 items-center gap-1.5 font-semibold text-soft">
        <span aria-hidden style={{ color: salud.color }}>♥</span> Health
      </span>
      <span className="relative h-[14px] flex-1 overflow-hidden rounded-full bg-white/10">
        <span className={`vida-relleno absolute inset-y-0 left-0 rounded-full ${critico ? "vida-pulsa" : ""}`}
          style={{ width: `${salud.valor}%`, background: `linear-gradient(90deg, color-mix(in oklab, ${salud.color} 55%, #100f13), ${salud.color})`, boxShadow: `0 0 10px color-mix(in oklab, ${salud.color} 60%, transparent)` }} />
      </span>
      <span className="w-[84px] shrink-0 text-right font-semibold" style={{ color: salud.color, transition: "color .6s ease" }}>{salud.palabra}</span>
    </div>
  );
}
