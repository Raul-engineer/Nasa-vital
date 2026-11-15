"use client";
import { useRouter } from "next/navigation";
import { ChipGeneral, ESTADO, Sparkline } from "@/components/Shell";
import { Icon } from "@/components/Icons";
import Personaje, { estadoPersonaje, GRUPOS, ORDEN_ESPACIO, ORDEN_MENTAL, ORDEN_VITALES } from "@/components/Personaje";
import { fmtNum } from "@/components/Widgets";
import { NOMBRE_SINTOMA } from "@/lib/analysis";
import { useQuickFix } from "@/lib/useQuickFix";

const TIP_URGENCIA = "Calculada con NEWS2, la escala que usan los hospitales para detectar deterioro.";
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
  if (t.estado === "info") return t.etiqueta || "Esfuerzo";
  switch (t.k) {
    case "fc":
      return `VFC ${t.vfc ?? "—"} ms`;
    case "spo2":
      return t.estado === "normal" ? "En rango" : t.etiqueta;
    case "pa":
      return t.valor != null && t.valor2 != null ? `Media ${Math.round(t.valor2 + (t.valor - t.valor2) / 3)} mmHg` : "Sin medición";
    case "fr":
      return t.estado === "normal" ? "En rango" : t.etiqueta;
    case "temp":
      return t.sintomas?.length ? `Síntomas: ${t.sintomas.map((x) => NOMBRE_SINTOMA[x] || x).join(", ")}` : "Sin síntomas";
    case "conciencia":
      return analisis.checkinHoy?.mareo_de_pie ? "Con mareo" : "Sin mareo";
    case "radiacion":
      return `Acumulado ${fmtNum(analisis.radiacion.carrera)} mSv`;
    case "huesos":
      return `Fuerza ${t.fuerza ?? "—"} · cardio ${t.cardio ?? "—"} min`;
    case "sueno":
      return `Reacción ${t.reaccion ?? "—"} ms`;
    case "animo":
      return `Estrés ${t.estres ?? "—"}/5 · tripulación ${t.tripulacion ?? "—"}/5`;
    default:
      return t.secundario;
  }
}

export const palabraEstado = (t) => (t.estado === "normal" ? "Normal" : t.etiqueta || ESTADO[t.estado]?.txt);

export function Flecha({ t }) {
  const c = t.cambio7;
  const g = c == null || !Number.isFinite(c) ? "→" : c > 0.02 ? "↗" : c < -0.02 ? "↘" : "→";
  return <span className="text-lg leading-none text-[#ffb888]" aria-label={g === "↗" ? "subiendo" : g === "↘" ? "bajando" : "estable"}>{g}</span>;
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

export function Metrica({ t, analisis, onClick, className = "" }) {
  const E = ESTADO[t.estado] || ESTADO.normal;
  return (
    <button onClick={onClick} aria-label={`${t.nombre}: ${t.texto} ${t.unidad}. ${palabraEstado(t)}. Ver análisis`}
      className={`glass glass-hover flex min-h-[154px] flex-col justify-between p-[18px] text-left ${t.estado === "critico" ? "glow-crit" : t.estado === "atencion" ? "glow-warn" : ""} ${className}`}>
      <span className="flex w-full items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 text-xs text-[#d6c9c9]">
          <Icon name={t.icono} size={16} className="shrink-0 text-[#ffb888]" />
          <span className="truncate">{t.nombre}</span>
        </span>
        <Flecha t={t} />
      </span>
      <span className="whitespace-nowrap">
        <span className={`font-display text-[clamp(23px,2.5vw,31px)] font-semibold tracking-[-0.7px] ${t.estado === "normal" ? "" : E.color}`}>{t.texto}</span>
        {t.unidad && <span className="ml-1 text-xs text-muted">{t.unidad}</span>}
      </span>
      <span className="flex w-full items-end justify-between gap-2">
        <span className={`flex min-w-0 items-center gap-2 text-[11px] ${E.color}`}>
          <span className="dot-estado" />
          <span className="truncate">{secundario(t, analisis)}</span>
        </span>
        {t.k === "conciencia" ? <DiasConciencia t={t} /> : <span className="hidden shrink-0 min-[400px]:block"><Sparkline data={t.serie7} color={E.hex} w={84} h={35} /></span>}
      </span>
    </button>
  );
}

export function Mini({ t, analisis, onClick, ancha = false }) {
  const E = ESTADO[t.estado] || ESTADO.normal;
  return (
    <button onClick={onClick} aria-label={`${t.nombre}: ${t.texto} ${t.unidad}. ${palabraEstado(t)}. Ver análisis`}
      className={`glass glass-hover flex min-h-[143px] flex-col justify-between p-[18px] text-left ${ancha ? "min-[1100px]:col-span-2" : ""} ${t.estado === "critico" ? "glow-crit" : t.estado === "atencion" ? "glow-warn" : ""}`}>
      <span className="flex w-full items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 text-xs text-[#d6c9c9]">
          <Icon name={t.icono} size={16} className="shrink-0 text-[#ffb888]" />
          <span className="truncate">{t.nombre}</span>
        </span>
        <Flecha t={t} />
      </span>
      <span className="my-2 whitespace-nowrap">
        <span className={`font-display text-[clamp(22px,2.2vw,26px)] font-semibold tracking-[-0.7px] ${t.estado === "normal" ? "" : E.color}`}>{t.texto}</span>
        {t.unidad && <span className="ml-1 text-xs text-muted">{t.k === "sueno" ? "horas" : t.unidad}</span>}
      </span>
      <span className="flex w-full flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <small className="min-w-0 truncate text-[11px] text-[#aa9fa4]">{secundario(t, analisis)}</small>
        <span className={`flex shrink-0 items-center gap-1.5 text-[11px] ${E.color}`}><span className="dot-estado" />{palabraEstado(t)}</span>
      </span>
    </button>
  );
}

export function Seccion({ glifo, titulo, n }) {
  return (
    <div className="mb-[13px] mt-[26px] flex items-center justify-between gap-2.5 px-0.5">
      <h2 className="text-lg font-semibold">{glifo} {titulo}</h2>
      <span className="text-[11px] tracking-wider text-[#b8a9ad]">{String(n).padStart(2, "0")} INDICADORES</span>
    </div>
  );
}

export function Urgencia({ nivel }) {
  return (
    <span className="flex items-center gap-1.5">
      <ChipGeneral estado={nivel.estado}>Signos vitales: urgencia {nivel.txt.toLowerCase()}</ChipGeneral>
      <span className="group relative inline-flex">
        <button type="button" aria-label="¿Cómo se calcula la urgencia?" aria-describedby="tip-urgencia"
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
  const palabra = eg === "critico" ? "Actúa ahora" : eg === "atencion" ? "Atención" : "Estable";
  return (
    <article className="glass relative col-span-2 min-h-[330px] overflow-hidden p-6 min-[640px]:col-span-3 min-[1100px]:col-span-1 min-[1100px]:col-start-4 min-[1100px]:row-span-2 min-[1100px]:row-start-1"
      style={{ background: "linear-gradient(130deg, #44302e99, #1b202a99), var(--glass)" }} aria-label="Estado del astronauta">
      <div className="absolute bottom-[5%] right-[2%] h-[85%] w-[56%]">
        <Personaje estado={estado} />
      </div>
      <div className="relative z-10 flex h-full max-w-[52%] flex-col justify-end gap-2.5">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#ffb67a45] bg-[#ffb67a1b] px-2.5 py-1.5 text-[11px] text-[#f4c9ac]">
          <span className="dot-estado text-ok" /> EN VIVO
        </span>
        <h2 className={`text-[clamp(26px,2.6vw,34px)] font-semibold leading-tight tracking-[-0.8px] ${ESTADO[eg].color}`}>{palabra}</h2>
        {motivo && <div className="truncate text-[13px] text-[#c9bdc0]">{motivo}</div>}
      </div>
    </article>
  );
}

export default function PanelTripulante({ astronautId, onVer }) {
  const router = useRouter();
  const { analisis, loading, error } = useQuickFix(astronautId);
  if (error) return <div className="glass p-6 text-crit">No se pudieron cargar los datos: {error}</div>;
  if (loading || !analisis) return <div className="glass grid min-h-[330px] place-items-center text-muted">Cargando…</div>;
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
