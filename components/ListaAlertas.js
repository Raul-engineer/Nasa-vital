"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "./Icons";
import { COLOR_GRAVEDAD, ETIQUETA_GRAVEDAD, ORDEN_GRAVEDAD } from "@/lib/analysis";
import { tiempoRelativo } from "./analisis/comun";

const CORTO = { fc: "FC", pa: "Presión", fr: "FR", temp: "Temperatura", spo2: "SpO₂", conciencia: "Conciencia", radiacion: "Radiación", vision: "Visión", huesos: "Huesos", cabina: "CO₂", sueno: "Sueño", animo: "Ánimo" };
const UNIDAD = { fc: "lpm", pa: "", fr: "rpm", temp: "°C", spo2: "%", conciencia: "", radiacion: "µSv/h", vision: "", huesos: "%", cabina: "ppm", sueno: "h", animo: "/100" };
const PLURAL = { critico: "Críticas", urgente: "Urgentes", moderado: "Moderadas" };
const TOOLTIP_VIDA = "Indicador orientativo calculado con tus alertas activas. No es un diagnóstico.";
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
  if (t.k === "conciencia") return `Conciencia: ${t.estado === "normal" ? t.texto : t.etiqueta}`;
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

function Fila({ a, onVer, sale }) {
  const color = COLOR_GRAVEDAD[a.nivel];
  return (
    <button onClick={() => onVer(a.k)} data-fila-alerta={a.k} data-gravedad={a.nivel} aria-label={`${ETIQUETA_GRAVEDAD[a.nivel]}: ${valorCorto(a.t)}. ${a.frase}. Ver análisis`}
      className={`relative flex w-full items-center gap-3 overflow-hidden rounded-l-none rounded-r-xl border border-l-0 bg-white/[0.04] py-1.5 pl-4 pr-3 text-left hover:bg-white/[0.09] ${sale ? "fila-sale pointer-events-none" : "fila-entra"}`}
      style={{ borderColor: `color-mix(in oklab, ${color} 28%, transparent)`, transition: "border-color .4s ease, background-color .2s" }}>
      <span aria-hidden className="absolute inset-y-0 left-0 w-[3px]" style={{ background: color, transition: "background .4s ease" }} />
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color, transition: "color .4s ease" }}>{ETIQUETA_GRAVEDAD[a.nivel]}</span>
          <span className="flex min-w-0 items-center gap-1.5 truncate text-[13px] font-semibold">
            <Icon name={a.t.icono} size={14} className="shrink-0 text-[#ffb888]" />
            <span className="truncate">{valorCorto(a.t)}</span>
          </span>
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted">{a.frase}</span>
      </span>
      <span className="shrink-0 self-start pt-0.5 text-[11px] text-muted">{tiempoRelativo(a.desde)}</span>
    </button>
  );
}

export function ListaAlertas({ items, onVer, max = 8, hrefMas = "/analisis?tab=alertas", className = "" }) {
  const [saliendo, setSaliendo] = useState([]);
  const previos = useRef({});
  const visibles = items.slice(0, max);
  const firma = visibles.map((a) => a.k).join("|");
  useEffect(() => {
    const ahora = Object.fromEntries(visibles.map((a) => [a.k, a]));
    const fuera = Object.keys(previos.current).filter((k) => !(k in ahora)).map((k) => previos.current[k]);
    previos.current = ahora;
    if (!fuera.length) return;
    setSaliendo((s) => [...s.filter((x) => !(x.k in ahora)), ...fuera]);
    const t = setTimeout(() => setSaliendo((s) => s.filter((x) => !fuera.includes(x))), 320);
    return () => clearTimeout(t);
  }, [firma]);
  const cuenta = (n) => items.filter((a) => a.nivel === n).length;
  const resto = items.length - visibles.length;
  const fantasmas = saliendo.filter((s) => !visibles.some((v) => v.k === s.k));
  return (
    <section aria-label="Alertas" className={`glass flex flex-col overflow-hidden p-4 ${className}`} data-lista-alertas>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h2 className="text-lg font-semibold">Alertas</h2>
        <div className="flex flex-wrap items-center gap-2.5">
          {["critico", "urgente", "moderado"].map((n) => cuenta(n) > 0 && (
            <span key={n} className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: COLOR_GRAVEDAD[n] }} data-cuenta={n}>
              <span className="dot-estado" style={{ width: 6, height: 6 }} />{cuenta(n)} {PLURAL[n]}
            </span>
          ))}
        </div>
      </div>
      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-ok/35 bg-ok/[0.07] p-5 text-center" data-sin-alertas>
          <span className="text-3xl" aria-hidden>👍</span>
          <span className="font-semibold text-ok">✓ Sin alertas · todo estable</span>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-1">
          {visibles.map((a) => <Fila key={a.k} a={a} onVer={onVer} />)}
          {fantasmas.map((a) => <Fila key={`f-${a.k}`} a={a} onVer={onVer} sale />)}
          {resto > 0 && (
            <Link href={hrefMas} className="mt-1 rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-center text-xs font-semibold text-soft hover:bg-white/[0.09] hover:text-fg" data-mas-alertas>
              +{resto} {resto === 1 ? "alerta más" : "alertas más"}
            </Link>
          )}
        </div>
      )}
    </section>
  );
}

export function BarraVida({ salud }) {
  if (!salud) return null;
  const critico = salud.clave === "critico";
  return (
    <div className="mx-auto flex w-[60%] min-w-[260px] max-w-[560px] items-center gap-3 rounded-full border border-white/12 bg-black/25 px-3.5 py-2 backdrop-blur-sm" title={TOOLTIP_VIDA}
      role="meter" aria-label="Salud" aria-valuemin={0} aria-valuemax={100} aria-valuenow={salud.valor} aria-valuetext={salud.palabra} data-salud={salud.clave}>
      <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-soft">
        <span aria-hidden style={{ color: salud.color }}>♥</span> Salud
      </span>
      <span className="relative h-3 flex-1 overflow-hidden rounded-full bg-white/10">
        <span className={`vida-relleno absolute inset-y-0 left-0 rounded-full ${critico ? "vida-pulsa" : ""}`}
          style={{ width: `${salud.valor}%`, background: `linear-gradient(90deg, color-mix(in oklab, ${salud.color} 55%, #100f13), ${salud.color})`, boxShadow: `0 0 10px color-mix(in oklab, ${salud.color} 60%, transparent)` }} />
      </span>
      <span className="w-[72px] shrink-0 text-right text-xs font-semibold" style={{ color: salud.color, transition: "color .6s ease" }}>{salud.palabra}</span>
    </div>
  );
}
