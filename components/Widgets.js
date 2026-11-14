"use client";
import { Icon } from "./Icons";
import { ESTADO, Sparkline } from "./Shell";
import { GlowingEffect } from "./Effects";
import { partesFuente } from "@/lib/fuentes";

export function Ring({ value, max = 100, size = 150, stroke = 12, color = "var(--color-violet)", children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} style={{ stroke: "color-mix(in oklab, var(--color-muted) 22%, transparent)" }} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          style={{ stroke: color, transition: "stroke-dashoffset 1s ease, stroke 0.5s", filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

export function Fuente({ ids, extra, children, className = "" }) {
  const partes = partesFuente(ids ?? (typeof children === "string" ? children : null));
  if (!partes.length && !extra) return null;
  return (
    <div className={`text-[10.5px] leading-snug text-muted ${className}`}>
      Basado en:{" "}
      {partes.map((p, i) => (
        <span key={i}>
          {i > 0 && " · "}
          {p.url ? <a href={p.url} target="_blank" rel="noopener noreferrer" className="underline decoration-dotted underline-offset-2 hover:text-accent">{p.texto}</a> : p.texto}
        </span>
      ))}
      {extra && <span>{partes.length ? " · " : ""}{extra}</span>}
    </div>
  );
}

export function Cambio({ valor, texto = "vs. 7 días" }) {
  if (valor == null || !Number.isFinite(valor)) return <span className="text-[11px] text-muted">—</span>;
  const p = Math.round(valor * 100);
  return (
    <span className="whitespace-nowrap text-[11px] text-muted">
      <span className="font-medium text-soft">{p === 0 ? "=" : p > 0 ? "▲" : "▼"} {Math.abs(p)} %</span> {texto}
    </span>
  );
}

export function EstadoPill({ estado = "normal", children, className = "" }) {
  const E = ESTADO[estado] || ESTADO.normal;
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium ${E.border} ${E.color} ${className}`}
      style={{ background: `color-mix(in oklab, ${E.hex} 10%, transparent)` }}>
      <span className={`h-1.5 w-1.5 rounded-full ${E.bg}`} />
      {children ?? E.txt}
    </span>
  );
}

export function SignoCard({ sg, activo, onClick, className = "" }) {
  if (!sg) return null;
  const E = ESTADO[sg.estado] || ESTADO.normal;
  return (
    <button
      onClick={onClick}
      aria-pressed={activo}
      className={`card relative flex h-full w-full flex-col justify-between gap-1 p-3.5 text-left transition hover:bg-ink/[0.03] ${
        activo ? "glow-accent" : sg.estado === "critico" ? "glow-crit" : sg.estado === "atencion" ? "glow-warn" : ""
      } ${className}`}
    >
      <GlowingEffect />
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className={sg.estado === "normal" ? "text-violet" : E.color}><Icon name={sg.icono} size={22} /></span>
          <span className="truncate text-sm font-medium">{sg.nombre}</span>
        </div>
        <span className="shrink-0 text-[10.5px] text-muted">Normal {sg.rango}</span>
      </div>
      <div className="flex items-end justify-between gap-2">
        <div className="leading-none">
          <span className={`text-3xl font-semibold tabular-nums ${sg.fuera ? "text-crit" : ""}`}>{sg.texto}</span>
          <span className="ml-1 text-sm text-muted">{sg.unidad}</span>
        </div>
        <Sparkline data={sg.serie.slice(-14)} color={E.hex} w={70} h={26} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-1">
        <EstadoPill estado={sg.estado}>{sg.etiqueta}</EstadoPill>
        <Cambio valor={sg.cambio7} />
      </div>
    </button>
  );
}

export function MiniCard({ titulo, icono, children, className = "", fuente, accion }) {
  return (
    <div className={`card relative flex flex-col p-4 ${className}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          {icono && <span className="text-accent"><Icon name={icono} size={18} /></span>}
          {titulo}
        </div>
        {accion}
      </div>
      <div className="flex-1">{children}</div>
      {fuente && <Fuente className="mt-2" ids={fuente} />}
    </div>
  );
}

export function Barra({ pct, color = "var(--color-violet)", marca }) {
  const p = Math.max(0, Math.min(1, pct || 0));
  return (
    <div className="relative h-2 rounded-full bg-ink/10">
      <div className="h-full rounded-full transition-all" style={{ width: `${p * 100}%`, background: color }} />
      {marca != null && <div className="absolute -top-1 h-4 w-0.5 rounded bg-muted" style={{ left: `${marca * 100}%` }} />}
    </div>
  );
}

export function colorPuntos(estado) {
  return ESTADO[estado]?.hex || ESTADO.normal.hex;
}

export function colorIndice(total, hayCritico) {
  if (hayCritico) return "var(--color-crit)";
  return total >= 80 ? "var(--color-ok)" : total >= 65 ? "var(--color-violet)" : total >= 50 ? "var(--color-warn)" : "var(--color-crit)";
}

export function fmtNum(v, dec = 0) {
  if (v == null || !Number.isFinite(Number(v))) return "—";
  return Number(v).toLocaleString("es-MX", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
