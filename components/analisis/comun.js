"use client";
import { Icon } from "@/components/Icons";
import { ESTADO } from "@/components/Shell";
import { fmtNum } from "@/components/Widgets";

export const DEC = { temp: 1, spo2: 1, sueno: 1 };

export const NIVEL = {
  ok: { estado: "normal", icono: "✓" },
  info: { estado: "info", icono: "⚡" },
  warn: { estado: "atencion", icono: "!" },
  bad: { estado: "critico", icono: "!" },
  alto: { estado: "atencion", icono: "↑" },
  bajo: { estado: "atencion", icono: "↓" },
};

export function simboloEstado(t) {
  if (t.estado === "normal") return { icono: "✓", palabra: "Normal" };
  if (t.estado === "info") return { icono: "⚡", palabra: t.etiqueta || "Esfuerzo" };
  if (/VFC|Síntomas|Mareo|Confus|Tormenta|refugio|Acumulado|Dolor|borrosa|Amsler/i.test(t.etiqueta || "")) return { icono: t.dir === "up" ? "↑" : t.dir === "down" ? "↓" : "!", palabra: t.etiqueta };
  if (t.dir === "up") return { icono: "↑", palabra: "Alto" };
  if (t.dir === "down") return { icono: "↓", palabra: "Bajo" };
  return { icono: "!", palabra: t.etiqueta || ESTADO[t.estado]?.txt };
}

export function IconoEstado({ estado, icono, size = 30 }) {
  const E = ESTADO[estado] || ESTADO.normal;
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full border-2 font-bold ${E.color} ${E.border}`}
      style={{ width: size, height: size, fontSize: size * 0.5, background: `color-mix(in oklab, ${E.hex} 14%, transparent)` }} aria-hidden>
      {icono}
    </span>
  );
}

export function ChipEstado({ estado = "normal", children, className = "" }) {
  const E = ESTADO[estado] || ESTADO.normal;
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${E.border} ${E.color} ${className}`}
      style={{ background: `color-mix(in oklab, ${E.hex} 10%, transparent)` }}>
      <span className={`h-2 w-2 rounded-full ${E.bg}`} />
      {children ?? E.txt}
    </span>
  );
}

export function Indicador({ etiqueta, icono, valor, unidad, palabra, color, extra }) {
  return (
    <div className="card relative flex min-w-0 flex-col gap-1 p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="etiqueta">{etiqueta}</span>
        {icono && <Icon name={icono} size={18} className="shrink-0 text-cyan" />}
      </div>
      <div className="flex items-baseline gap-1.5 whitespace-nowrap">
        <span className={`num text-[32px] font-semibold leading-none ${color || ""}`}>{valor}</span>
        {unidad && <span className="text-sm text-muted">{unidad}</span>}
      </div>
      <div className="flex items-center gap-2 truncate text-xs text-muted">{palabra}{extra}</div>
    </div>
  );
}

export function Pildoras({ opciones, valor, onChange, etiqueta }) {
  return (
    <div className="flex gap-1 rounded-full border border-line p-1" role="tablist" aria-label={etiqueta}>
      {opciones.map(([k, txt]) => (
        <button key={k} role="tab" aria-selected={valor === k} onClick={() => onChange(k)}
          className={`rounded-full px-3 py-1 text-sm transition ${valor === k ? "bg-cyan/15 font-semibold text-cyan" : "text-soft hover:bg-ink/5"}`}>
          {txt}
        </button>
      ))}
    </div>
  );
}

export function Progreso({ pct, color = "var(--color-cyan)", etiqueta, valor }) {
  const p = Math.max(0, Math.min(1, pct || 0));
  return (
    <div>
      {(etiqueta || valor) && (
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-muted">{etiqueta}</span>
          <span className="num text-soft">{valor ?? `${Math.round(p * 100)} %`}</span>
        </div>
      )}
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/10">
          <div className="h-full rounded-full transition-all" style={{ width: `${p * 100}%`, background: color }} />
        </div>
        {!etiqueta && !valor && <span className="num w-10 text-right text-xs text-soft">{Math.round((pct || 0) * 100)} %</span>}
      </div>
    </div>
  );
}

export const validos = (arr) => (arr || []).filter((x) => x != null && Number.isFinite(Number(x))).map(Number);
export const promedio = (arr) => (arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : null);

export function fmtRango(r, dec = 0) {
  if (!r) return null;
  return `${fmtNum(r[0], dec)}–${fmtNum(r[1], dec)}`;
}

export function tuNormal(t) {
  const dec = DEC[t.k] || 0;
  if (t.k === "conciencia") return "Alerta";
  if (t.k === "vision") return "OK";
  if (t.k === "pa" && t.rangoPersonal && t.rangoPersonal2) return `${fmtRango(t.rangoPersonal)} / ${fmtRango(t.rangoPersonal2)}`;
  return fmtRango(t.rangoPersonal, dec) || t.rango;
}

export function hhmm(d) {
  return d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function fechaCorta(f) {
  return new Date(f + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

export function horaMedicion(t, analisis, ahora) {
  if (["fc", "spo2", "fr", "temp", "radiacion", "cabina"].includes(t.k)) return ahora ? hhmm(ahora) : "—";
  if (t.k === "pa") return analisis.hoy.horaPa ? hhmm(new Date(analisis.hoy.horaPa)) : "07:00";
  if (t.k === "sueno") return "06:00";
  if (t.k === "animo") return t.who5Fecha ? fechaCorta(t.who5Fecha) : "—";
  if (t.k === "huesos") return "Hoy";
  return "08:00";
}

export function tiempoRelativo(ms, ahora = Date.now()) {
  const d = ms - ahora;
  const a = Math.abs(d);
  const txt = a < 6e4 ? "1 min" : a < 36e5 ? `${Math.round(a / 6e4)} min` : a < 864e5 * 2 ? `${Math.round(a / 36e5)} h` : `${Math.round(a / 864e5)} días`;
  return d > 0 ? `en ${txt}` : `hace ${txt}`;
}
