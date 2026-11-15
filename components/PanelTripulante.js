"use client";
import "./cyber-medic.css";
import "./cyber-estilo.css";
import { useRouter } from "next/navigation";
import { ChipGeneral, ESTADO, Sparkline } from "@/components/Shell";
import { Icon } from "@/components/Icons";
import Personaje, { estadoPersonaje, GRUPOS, ORDEN_ESPACIO, ORDEN_MENTAL, ORDEN_VITALES } from "@/components/Personaje";
import { fmtNum } from "@/components/Widgets";
import { NOMBRE_SINTOMA } from "@/lib/analysis";
import { useQuickFix } from "@/lib/useQuickFix";

const TIP_URGENCIA = "Calculated with NEWS2, the scale hospitals use to detect deterioration.";
export const ORDEN_VISUAL = [...ORDEN_VITALES, ...ORDEN_ESPACIO, ...ORDEN_MENTAL];

export function motivoGeneral(analisis, porK) {
  const eg = analisis.general;
  if (eg === "normal") return "";
  let cand = ORDEN_VISUAL.map((k) => porK[k]).filter((t) => t?.estado === eg);
  if (!cand.length) {
    const vars = new Set(analisis.activas.filter((a) => a.estado === eg).flatMap((a) => a.vars || [a.var]).filter(Boolean));
    cand = ORDEN_VISUAL.filter((k) => vars.has(k)).map((k) => porK[k]);
  }
  if (!cand.length) return "";
  return `${cand[0].nombre}${cand.length > 1 ? ` +${cand.length - 1}` : ""}`;
}

export function secundario(t, analisis) {
  if (t.estado === "info") return t.etiqueta || "Exertion";
  switch (t.k) {
    case "fc":
      return `HRV ${t.vfc ?? "—"} ms`;
    case "spo2":
      return t.estado === "normal" ? "In range" : t.etiqueta;
    case "pa":
      return t.valor != null && t.valor2 != null ? `Mean ${Math.round(t.valor2 + (t.valor - t.valor2) / 3)} mmHg` : "No reading";
    case "fr":
      return t.estado === "normal" ? "In range" : t.etiqueta;
    case "temp":
      return t.sintomas?.length ? `Symptoms: ${t.sintomas.map((x) => NOMBRE_SINTOMA[x] || x).join(", ")}` : "No symptoms";
    case "conciencia":
      return analisis.checkinHoy?.mareo_de_pie ? "Dizzy" : "No dizziness";
    case "radiacion":
      return `Cumulative ${fmtNum(analisis.radiacion.carrera)} mSv`;
    case "huesos":
      return `Strength ${t.fuerza ?? "—"} · cardio ${t.cardio ?? "—"} min`;
    case "sueno":
      return `Reaction ${t.reaccion ?? "—"} ms`;
    case "animo":
      return `Stress ${t.estres ?? "—"}/5 · crew ${t.tripulacion ?? "—"}/5`;
    default:
      return t.secundario;
  }
}

export const palabraEstado = (t) => (t.estado === "normal" ? "Normal" : t.etiqueta || ESTADO[t.estado]?.txt);

export function Flecha({ t }) {
  const c = t.cambio7;
  const g = c == null || !Number.isFinite(c) ? "→" : c > 0.02 ? "↗" : c < -0.02 ? "↘" : "→";
  return <span className="text-lg leading-none text-[#a5b4ff]" aria-label={g === "↗" ? "rising" : g === "↘" ? "falling" : "stable"}>{g}</span>;
}

export function DiasConciencia({ t }) {
  return (
    <span className="flex h-[35px] items-end gap-1" aria-hidden>
      {t.serie7.map((v, i) => (
        <span key={i} className="w-2 rounded-sm" style={{ height: v === 2 ? 30 : v === 1 ? 22 : 14, background: v === 2 ? "var(--color-crit)" : v === 1 ? "var(--color-warn)" : "color-mix(in oklab, var(--color-ok) 65%, transparent)" }} />
      ))}
    </span>
  );
}

function Encabezado({ t }) {
  return (
    <span className="pointer-events-none relative flex w-full items-center justify-between gap-2">
      <span className="flex min-w-0 items-center gap-2 text-xs text-[#c9cde8]">
        <Icon name={t.icono} size={16} className="shrink-0 text-[#a5b4ff]" />
        <span className="truncate">{t.nombre}</span>
      </span>
      <Flecha t={t} />
    </span>
  );
}

function Tarjeta({ t, onClick, className, accion = "View analysis", extra, children, base = "flex flex-col justify-between p-[18px]", estilo, sinBrillo = false, cyber = false }) {
  const clase = cyber
    ? `tarjeta-cyber ${base} text-left ${className}`
    : `glass glass-hover ${base} text-left ${sinBrillo ? "" : t.estado === "critico" ? "glow-crit" : t.estado === "atencion" ? "glow-warn" : t.estado === "info" ? "glow-info" : ""} ${className}`;
  return (
    <div data-tarjeta style={estilo} className={clase}>
      {cyber && <span className="cm-backdrop" aria-hidden><span className="cm-corner" /></span>}
      <button type="button" onClick={onClick} aria-label={`${t.nombre}: ${t.texto} ${t.unidad}. ${palabraEstado(t)}. ${accion}`}
        aria-haspopup={extra ? "dialog" : undefined}
        className="absolute inset-0 z-[1] rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-accent" />
      {children}
      {extra}
    </div>
  );
}

export function Metrica({ t, analisis, onClick, className = "", extra, accion, acento = null, grande = false, cyber = false }) {
  const E = ESTADO[t.estado] || ESTADO.normal;
  const color = acento || E.hex;
  const estilo = cyber
    ? { "--accent": color }
    : acento ? { borderColor: `color-mix(in oklab, ${acento} 62%, transparent)`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.2), 0 0 0 1px color-mix(in oklab, ${acento} 60%, transparent), 0 0 28px color-mix(in oklab, ${acento} 20%, transparent)`, transition: "border-color .4s, box-shadow .4s" } : undefined;
  return (
    <Tarjeta t={t} onClick={onClick} accion={accion} extra={extra} estilo={estilo} sinBrillo={!!acento} cyber={cyber} base={`flex flex-col justify-between ${grande ? "p-6" : "p-[18px]"}`} className={`min-h-[154px] ${className}`}>
      <span className="tc-cabeza pointer-events-none relative flex w-full items-center justify-between gap-2">
        <span className={`flex min-w-0 items-center gap-2 text-[#c9cde8] ${grande ? "text-base" : "text-xs"}`}>
          <Icon name={t.icono} size={grande ? 20 : 16} className="tc-icono shrink-0 text-[#a5b4ff]" />
          <span className="tc-nombre truncate">{t.nombre}</span>
        </span>
        <Flecha t={t} />
      </span>
      <span className="pointer-events-none relative whitespace-nowrap">
        <span className={`tc-valor inline-block font-display font-semibold ${grande ? "text-[52px] leading-none tracking-[-1.5px]" : "text-[clamp(23px,2.5vw,31px)] tracking-[-0.7px]"} ${t.estado === "normal" || acento ? "" : E.color}`} style={acento ? { color: acento } : undefined}>{t.texto}</span>
        {t.unidad && <span className={`ml-1.5 text-muted ${grande ? "text-base" : "text-xs"}`}>{t.unidad}</span>}
      </span>
      <span className="pointer-events-none relative flex w-full items-end justify-between gap-2">
        <span className={`flex min-w-0 items-center gap-2 ${grande ? "text-sm" : "text-[11px]"} ${acento ? "" : E.color}`} style={acento ? { color: acento } : undefined}>
          <span className="dot-estado" />
          <span className="truncate">{secundario(t, analisis)}</span>
        </span>
        {t.k === "conciencia" ? <DiasConciencia t={t} /> : <span className="hidden shrink-0 min-[400px]:block"><Sparkline data={t.serie7} color={color} w={grande ? 140 : 84} h={grande ? 48 : 35} /></span>}
      </span>
    </Tarjeta>
  );
}

export function Mini({ t, analisis, onClick, ancha = false, extra, accion }) {
  const E = ESTADO[t.estado] || ESTADO.normal;
  return (
    <Tarjeta t={t} onClick={onClick} accion={accion} extra={extra} className={`min-h-[143px] ${ancha ? "min-[1100px]:col-span-2" : ""}`}>
      <Encabezado t={t} />
      <span className="pointer-events-none relative my-2 whitespace-nowrap">
        <span className={`font-display text-[clamp(22px,2.2vw,26px)] font-semibold tracking-[-0.7px] ${t.estado === "normal" ? "" : E.color}`}>{t.texto}</span>
        {t.unidad && <span className="ml-1 text-xs text-muted">{t.k === "sueno" ? "hours" : t.unidad}</span>}
      </span>
      <span className="pointer-events-none relative flex w-full flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <small className="min-w-0 truncate text-[11px] text-[#9ea4c4]">{secundario(t, analisis)}</small>
        <span className={`flex shrink-0 items-center gap-1.5 text-[11px] ${E.color}`}><span className="dot-estado" />{palabraEstado(t)}</span>
      </span>
    </Tarjeta>
  );
}

export function Seccion({ glifo, titulo, n }) {
  return (
    <div className="mb-[13px] mt-[26px] flex items-center justify-between gap-2.5 px-0.5">
      <h2 className="text-lg font-semibold">{glifo} {titulo}</h2>
      <span className="text-[11px] tracking-wider text-[#a9aed0]">{String(n).padStart(2, "0")} INDICATORS</span>
    </div>
  );
}

export function Urgencia({ nivel }) {
  return (
    <span className="flex items-center gap-1.5">
      <ChipGeneral estado={nivel.estado}>Vital signs: {nivel.txt.toLowerCase()} urgency</ChipGeneral>
      <span className="group relative inline-flex">
        <button type="button" aria-label="How is urgency calculated?" aria-describedby="tip-urgencia"
          className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-white/[0.06] text-xs font-semibold text-muted hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
          ?
        </button>
        <span id="tip-urgencia" role="tooltip"
          className="glass pointer-events-none absolute right-0 top-9 z-30 w-64 p-3 text-xs leading-snug text-soft opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
          {TIP_URGENCIA}
        </span>
      </span>
    </span>
  );
}

export function PanelAstronauta({ analisis, motivo }) {
  const estado = estadoPersonaje(analisis);
  const eg = analisis.general;
  const palabra = eg === "critico" ? "Act now" : eg === "atencion" ? "Attention" : "Stable";
  return (
    <article className="glass relative col-span-2 min-h-[330px] overflow-hidden p-6 min-[640px]:col-span-3 min-[1100px]:col-span-1 min-[1100px]:col-start-4 min-[1100px]:row-span-2 min-[1100px]:row-start-1"
      style={{ background: "linear-gradient(130deg, #1d2350aa, #1b202a99), var(--glass)" }} aria-label="Astronaut status">
      <div className="absolute bottom-[5%] right-[2%] h-[85%] w-[56%]">
        <Personaje estado={estado} />
      </div>
      <div className="relative z-10 flex h-full max-w-[52%] flex-col justify-end gap-2.5">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#8f86ff45] bg-[#8f86ff1b] px-2.5 py-1.5 text-[11px] text-[#c9d2ff]">
          <span className="dot-estado text-ok" /> LIVE
        </span>
        <h2 className={`text-[clamp(26px,2.6vw,34px)] font-semibold leading-tight tracking-[-0.8px] ${ESTADO[eg].color}`}>{palabra}</h2>
        {motivo && <div className="truncate text-[13px] text-[#c3c8e4]">{motivo}</div>}
      </div>
    </article>
  );
}

export default function PanelTripulante({ astronautId, onVer }) {
  const router = useRouter();
  const { analisis, loading, error } = useQuickFix(astronautId);
  if (error) return <div className="glass p-6 text-crit">Could not load the data: {error}</div>;
  if (loading || !analisis) return <div className="glass grid min-h-[330px] place-items-center text-muted">Loading…</div>;
  const porK = Object.fromEntries(analisis.tarjetas.map((t) => [t.k, t]));
  const motivo = motivoGeneral(analisis, porK);
  const ir = onVer || ((k) => router.push(`/analisis?var=${k}&a=${astronautId}`));
  return (
    <div>
      <section aria-label={GRUPOS.vitales} className="grid grid-cols-2 gap-[9px] min-[640px]:grid-cols-3 min-[640px]:gap-[14px] min-[1100px]:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.55fr)]">
        <PanelAstronauta analisis={analisis} motivo={motivo} />
        {ORDEN_VITALES.map((k) => <Metrica key={k} t={porK[k]} analisis={analisis} onClick={() => ir(k)} />)}
      </section>
      <Seccion glifo="✦" titulo={GRUPOS.espacio} n={ORDEN_ESPACIO.length} />
      <section aria-label={GRUPOS.espacio} className="grid grid-cols-2 gap-[9px] min-[640px]:gap-[14px] min-[1100px]:grid-cols-4">
        {ORDEN_ESPACIO.map((k) => <Mini key={k} t={porK[k]} analisis={analisis} onClick={() => ir(k)} />)}
      </section>
      <Seccion glifo="◈" titulo={GRUPOS.mental} n={ORDEN_MENTAL.length} />
      <section aria-label={GRUPOS.mental} className="grid grid-cols-2 gap-[9px] min-[640px]:gap-[14px] min-[1100px]:grid-cols-4">
        {ORDEN_MENTAL.map((k) => <Mini key={k} t={porK[k]} analisis={analisis} onClick={() => ir(k)} ancha />)}
      </section>
    </div>
  );
}

export function Compacta({ t, onClick, extra, accion, className = "" }) {
  const E = ESTADO[t.estado] || ESTADO.normal;
  const alerta = t.estado !== "normal";
  return (
    <Tarjeta t={t} onClick={onClick} accion={accion} extra={extra} base="flex items-center gap-3 px-4 py-3" className={`compacta min-h-[68px] ${className}`}>
      <span className="pointer-events-none relative grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.05] text-[#a5b4ff]">
        <Icon name={t.icono} size={17} />
      </span>
      <span className="pointer-events-none relative min-w-0 flex-1 truncate font-display text-[15px] font-medium tracking-[-0.2px] text-fg">{t.nombre}</span>
      <span className={`pointer-events-none relative flex shrink-0 items-center gap-1.5 text-[11px] font-semibold ${E.color}`}>
        {alerta && <span className="hidden min-[400px]:inline">{palabraEstado(t)}</span>}
        <span className="dot-estado" />
      </span>
      <span className="compacta-flecha pointer-events-none relative shrink-0 text-muted" aria-hidden>›</span>
    </Tarjeta>
  );
}

export function Detalle({ t, analisis }) {
  const E = ESTADO[t.estado] || ESTADO.normal;
  return (
    <div className="cm-detalle">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <span className="whitespace-nowrap">
          <span className="font-display text-[34px] font-semibold leading-none tracking-[-0.8px]" style={t.estado === "normal" ? { color: "#eef0ff" } : { color: E.hex }}>{t.texto}</span>
          {t.unidad && <span className="ml-1.5 text-xs text-muted">{t.k === "sueno" ? "hours" : t.unidad}</span>}
        </span>
        <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: E.hex }}><span className="dot-estado" />{palabraEstado(t)}</span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <span className="min-w-0 text-[13px] text-soft">{secundario(t, analisis)}</span>
        {t.k === "conciencia" ? <DiasConciencia t={t} /> : <span className="shrink-0"><Sparkline data={t.serie7} color={E.hex} w={110} h={34} /></span>}
      </div>
    </div>
  );
}
