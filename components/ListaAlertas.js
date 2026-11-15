"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "./Icons";
import { COLOR_GRAVEDAD, ETIQUETA_GRAVEDAD, ORDEN_GRAVEDAD } from "@/lib/analysis";
import { tiempoRelativo } from "./analisis/comun";

const CORTO = { fc: "FC", pa: "Presión", fr: "FR", temp: "Temperatura", spo2: "SpO₂", conciencia: "Conciencia", radiacion: "Radiación", vision: "Visión", huesos: "Huesos", cabina: "CO₂", sueno: "Sueño", animo: "Ánimo" };
const UNIDAD = { fc: "lpm", pa: "", fr: "rpm", temp: "°C", spo2: "%", conciencia: "", radiacion: "µSv/h", vision: "", huesos: "%", cabina: "ppm", sueno: "h", animo: "/100" };
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

export const FILTROS = ["critico", "urgente", "moderado", "info"];
const NOMBRE_FILTRO = { critico: "Críticas", urgente: "Urgentes", moderado: "Moderadas", info: "Esfuerzo" };
const COLOR_TODAS = "#a8fff0";

function ChipFiltro({ activo, color, texto, n, onClick, punto = true, clave }) {
  return (
    <button onClick={onClick} aria-pressed={activo} data-filtro={clave}
      className="flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition"
      style={activo ? { background: color, borderColor: color, color: "#100f13", boxShadow: `0 0 14px color-mix(in oklab, ${color} 45%, transparent)` } : { borderColor: `color-mix(in oklab, ${color} 45%, transparent)`, color, background: `color-mix(in oklab, ${color} 8%, transparent)` }}>
      {punto && <span className="dot-estado" style={{ width: 6, height: 6, color: activo ? "#100f13" : color }} />}
      {texto} · {n}
    </button>
  );
}

function ChipAlerta({ a, onVer, onHover }) {
  const color = COLOR_GRAVEDAD[a.nivel];
  return (
    <button onClick={() => onVer(a.k)} onMouseEnter={() => onHover(a.k)} onMouseLeave={() => onHover(null)} onFocus={() => onHover(a.k)} onBlur={() => onHover(null)}
      data-chip-alerta={a.k} data-gravedad={a.nivel} aria-label={`${ETIQUETA_GRAVEDAD[a.nivel]}: ${valorCorto(a.t)}. ${a.frase}. Ver análisis`}
      className="burbuja-entra flex min-h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border bg-white/[0.04] py-1.5 pl-2.5 pr-3 text-left hover:bg-white/[0.09]"
      style={{ borderColor: `color-mix(in oklab, ${color} 60%, transparent)`, transition: "border-color .4s ease, background-color .2s" }}>
      <span className="dot-estado" style={{ color }} />
      <span className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color, transition: "color .4s ease" }}>{ETIQUETA_GRAVEDAD[a.nivel]}</span>
      <Icon name={a.t.icono} size={14} className="text-[#ffb888]" />
      <span className="text-[13px] font-semibold">{valorCorto(a.t)}</span>
      <span className="text-[11px] text-muted">{tiempoRelativo(a.desde)}</span>
    </button>
  );
}

export function FranjaAlertas({ items, filtro, onFiltro, onVer, onHover, max = 8, hrefMas = "/analisis?tab=alertas" }) {
  const cuenta = (n) => items.filter((a) => a.nivel === n).length;
  const filtrados = filtro ? items.filter((a) => a.nivel === filtro) : items;
  const visibles = filtrados.slice(0, max);
  const resto = filtrados.length - visibles.length;
  if (!items.length)
    return (
      <section aria-label="Alertas" className="glass flex min-h-[56px] items-center px-4 py-2.5" data-franja-alertas data-sin-alertas>
        <span className="flex items-center gap-2 text-sm font-semibold text-ok"><span aria-hidden>✓</span> Sin alertas · todo estable</span>
      </section>
    );
  return (
    <section aria-label="Alertas" className="glass flex min-h-[56px] flex-col gap-2 px-2.5 py-2.5 min-[900px]:flex-row min-[900px]:items-center" data-franja-alertas>
      <div className="no-scrollbar flex shrink-0 items-center gap-1.5 overflow-x-auto" role="group" aria-label="Filtrar por gravedad">
        <ChipFiltro clave="todas" activo={!filtro} color={COLOR_TODAS} texto="Todas" n={items.length} punto={false} onClick={() => onFiltro(null)} />
        {FILTROS.map((f) => cuenta(f) > 0 && (
          <ChipFiltro key={f} clave={f} activo={filtro === f} color={COLOR_GRAVEDAD[f]} texto={NOMBRE_FILTRO[f]} n={cuenta(f)} onClick={() => onFiltro(filtro === f ? null : f)} />
        ))}
      </div>
      <span aria-hidden className="hidden h-7 w-px shrink-0 bg-white/15 min-[900px]:block" />
      <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto" aria-label="Alertas activas">
        {visibles.map((a) => <ChipAlerta key={`${a.k}-${a.nivel}`} a={a} onVer={onVer} onHover={onHover} />)}
        {resto > 0 && (
          <Link href={hrefMas} className="flex min-h-9 shrink-0 items-center rounded-full border border-white/15 bg-white/[0.05] px-3 text-xs font-semibold text-soft hover:text-fg" data-mas-alertas>
            +{resto}
          </Link>
        )}
      </div>
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
