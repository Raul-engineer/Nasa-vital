"use client";
import "./cyber-medic.css";
import { ESTADO } from "@/components/Shell";
import { palabraEstado } from "@/components/PanelTripulante";

const ACENTO = {
  normal: "hsl(175 100% 77%)",
  atencion: "var(--color-warn)",
  critico: "var(--color-crit)",
  info: "var(--color-info)",
  sin: "var(--color-muted)",
};

const GLIFO = { normal: "✓", atencion: "!", critico: "!!", info: "⚡", sin: "–" };

function Esquina() {
  return (
    <span className="cm-backdrop">
      <span className="cm-corner" />
    </span>
  );
}

export default function BotonVital({ t, onClick, extra, className = "" }) {
  const estado = ESTADO[t.estado] ? t.estado : "normal";
  return (
    <div data-tarjeta className={`cm-vital-caja ${className}`}>
      <button type="button" className="cm-btn cm-vital" data-estado={estado} style={{ "--accent": ACENTO[estado] }} onClick={onClick}
        aria-label={`${t.nombre}: ${t.texto} ${t.unidad}. ${palabraEstado(t)}. Ver detalle`} aria-haspopup="dialog" aria-keyshortcuts="M">
        <Esquina />
        <kbd>{GLIFO[estado]}</kbd>
        <span className="cm-vital-nombre">{t.nombre}</span>
        {estado !== "normal" && <span className="cm-vital-estado">{palabraEstado(t)}</span>}
      </button>
      {extra}
    </div>
  );
}
