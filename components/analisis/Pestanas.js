"use client";
import { ESTADO } from "@/components/Shell";
import { ESTADO_DE_NIVEL } from "@/lib/cuerpo";

export function Contador({ n, nivel, color = null, pulso, grande = false }) {
  if (!n || (!nivel && !color)) return null;
  const hex = color || ESTADO[ESTADO_DE_NIVEL[nivel]]?.hex;
  return (
    <span key={pulso} className={`inline-flex items-center gap-1 font-bold normal-case ${grande ? "" : "text-[10px]"} ${pulso ? "pulso-contador" : ""}`} style={{ color: hex }} data-contador={nivel || "alerta"}>
      {!grande && <span className="dot-estado" style={{ width: 6, height: 6 }} />}
      {n}
    </span>
  );
}

export function ChipMetrica({ id, etiqueta, valor, unidad, colorPunto, colorBorde = null, activo, atenuado = false, nota = null, nivel, onClick, datos = {} }) {
  return (
    <button onClick={onClick} role="tab" aria-selected={activo} data-chip={id} data-nivel={nivel} {...datos}
      className={`glass flex items-center gap-2 rounded-full px-3.5 py-2 text-sm transition ${activo ? "bg-white/[0.14] font-semibold" : "hover:bg-white/[0.08]"} ${atenuado ? "opacity-55" : ""}`}
      style={{ borderRadius: 9999, borderColor: colorBorde ? `color-mix(in oklab, ${colorBorde} ${activo ? 85 : 55}%, transparent)` : activo ? "rgba(168,255,240,0.7)" : undefined, boxShadow: activo ? `0 0 0 1px ${colorBorde || "rgba(168,255,240,0.6)"}, 0 0 18px color-mix(in oklab, ${colorBorde || "#a8fff0"} 25%, transparent)` : undefined }}>
      <span className="dot-estado" style={{ color: colorPunto }} />
      <span>{etiqueta}</span>
      <span className="font-display font-semibold">{valor}{unidad && <span className="ml-0.5 text-xs font-normal text-muted">{unidad}</span>}</span>
      {nota && <span className="text-xs font-normal text-muted">{nota}</span>}
    </button>
  );
}
