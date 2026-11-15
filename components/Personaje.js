"use client";
import { useId } from "react";

export const ORDEN_VITALES = ["fc", "spo2", "pa", "fr", "temp", "conciencia"];
export const ORDEN_ESPACIO = ["radiacion", "vision", "huesos", "cabina"];
export const ORDEN_MENTAL = ["sueno", "animo"];
export const GRUPOS = { vitales: "Signos vitales", espacio: "Salud en el espacio", mental: "Salud mental y bienestar" };
export const CATEGORIAS = [["vitales", ORDEN_VITALES], ["espacio", ORDEN_ESPACIO], ["mental", ORDEN_MENTAL]];

export const ESTADOS_PERSONAJE = {
  estable: { color: "#83e0b7", flota: "4s", pulso: "4s", visor: "#5a6077" },
  atencion: { color: "#ffbe72", flota: "3.6s", pulso: "2.6s", visor: "#6b5a48" },
  critico: { color: "#ff7278", flota: "3.2s", pulso: "1.6s", visor: "#6e4048" },
  esfuerzo: { color: "#7cc4ff", flota: "2.2s", pulso: "1.2s", visor: "#3f5c7c" },
  fatiga: { color: "#b69cff", flota: "7.5s", pulso: "5s", visor: "#4f4870" },
  fiebre: { color: "#ff7278", flota: "3s", pulso: "1.4s", visor: "#7a3f3a" },
  radiacion: { color: "#d38bff", flota: "3.4s", pulso: "1s", visor: "#5c3f78" },
};

export function estadoPersonaje(analisis) {
  if (!analisis) return "estable";
  const porK = Object.fromEntries(analisis.tarjetas.map((t) => [t.k, t]));
  const act = analisis.actividad || {};
  if (analisis.radiacion?.activo) return "radiacion";
  if (act.fiebre || porK.temp?.etiqueta === "Fiebre") return "fiebre";
  if (act.estado === "ejercicio" || act.estado === "recuperacion") return "esfuerzo";
  if (analisis.general !== "normal" && porK.sueno && porK.sueno.estado === analisis.general) return "fatiga";
  if (analisis.general === "critico") return "critico";
  if (analisis.general === "atencion") return "atencion";
  return "estable";
}

export default function Personaje({ estado = "estable", className = "" }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const E = ESTADOS_PERSONAJE[estado] || ESTADOS_PERSONAJE.estable;
  return (
    <div className={`relative h-full w-full ${className}`} data-estado={estado} style={{ "--flota": E.flota, "--pulso": E.pulso }}>
      <div aria-hidden className="halo-pulso pointer-events-none absolute left-1/2 top-[46%] aspect-square w-[78%] max-w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full border transition-all duration-700"
        style={{ borderColor: `${E.color}66`, boxShadow: `0 0 0 26px rgba(255,255,255,0.025), 0 0 0 65px rgba(255,255,255,0.02), 0 0 60px ${E.color}55, inset 0 0 40px ${E.color}22` }} />
      <div className="absolute inset-0 grid place-items-center">
        <svg viewBox="0 0 260 350" className="astro-float h-full max-h-full max-w-full transition-[filter] duration-700" style={{ filter: `drop-shadow(0 0 25px ${E.color}66)` }} role="img" aria-label={`Astronauta: ${estado}`}>
          <defs>
            <linearGradient id={`suit-${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#fff4e8" />
              <stop offset=".52" stopColor="#c8c9d4" />
              <stop offset="1" stopColor="#777f9b" />
            </linearGradient>
            <linearGradient id={`visor-${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop stopColor={E.color} stopOpacity=".75" />
              <stop offset=".35" stopColor={E.visor} />
              <stop offset="1" stopColor="#171e2c" />
            </linearGradient>
          </defs>
          <ellipse cx="132" cy="324" rx="76" ry="12" fill="none" stroke={E.color} opacity=".5" />
          <g transform="rotate(-8 132 180)">
            <rect x="86" y="128" width="92" height="124" rx="30" fill={`url(#suit-${uid})`} stroke="#fff1e5" strokeWidth="4" />
            <rect x="97" y="146" width="70" height="65" rx="13" fill="#353d53" stroke={E.color} strokeWidth="3" />
            <rect x="108" y="158" width="47" height="7" rx="3" fill={E.color} />
            <circle cx="116" cy="184" r="5" fill="#80e2bd" />
            <circle cx="136" cy="184" r="5" fill={E.color} />
            <rect x="63" y="137" width="27" height="96" rx="14" fill={`url(#suit-${uid})`} transform="rotate(18 77 185)" />
            <rect x="176" y="137" width="27" height="96" rx="14" fill={`url(#suit-${uid})`} transform="rotate(-18 189 185)" />
            <rect x="89" y="236" width="37" height="88" rx="18" fill={`url(#suit-${uid})`} />
            <rect x="138" y="236" width="37" height="88" rx="18" fill={`url(#suit-${uid})`} />
            <rect x="83" y="306" width="47" height="22" rx="9" fill="#5b627a" />
            <rect x="135" y="306" width="47" height="22" rx="9" fill="#5b627a" />
            <rect x="79" y="38" width="111" height="110" rx="52" fill={`url(#suit-${uid})`} stroke="#fff4e9" strokeWidth="5" />
            <rect x="90" y="49" width="89" height="85" rx="42" fill={`url(#visor-${uid})`} stroke={E.color} strokeWidth="4" />
            <path d="M104 71 Q134 48 162 67" fill="none" stroke="#fff7eb" strokeWidth="8" opacity=".42" strokeLinecap="round" />
            <rect x="113" y="126" width="43" height="16" rx="7" fill="#f7a776" />
          </g>
          <circle cx="208" cy="57" r="3" fill={E.color} />
          <circle cx="34" cy="128" r="2" fill="#ffffff" />
          <path d="M217 205l8 8m0-8l-8 8" stroke={E.color} opacity=".6" />
        </svg>
      </div>
    </div>
  );
}
