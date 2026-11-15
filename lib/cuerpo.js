export const POSES = {
  base: "/esqueleto.webp",
  estable: "/poses/ok.webp",
  esfuerzo: "/poses/esfuerzo.webp",
  fatiga: "/poses/cansado.webp",
  fiebre: "/poses/enfermo.webp",
  critico: "/poses/alerta.webp",
  radiacion: "/poses/alerta.webp",
};

export const PROPORCION = 0.586;

export const ZONAS = {
  cabeza: { x: 50, y: 5 },
  ojos: { x: 50, y: 4 },
  corazon: { x: 54, y: 24 },
  pulmones: { x: 44, y: 22 },
  abdomen: { x: 50, y: 36 },
  manoIzq: { x: 8, y: 47 },
  manoDer: { x: 92, y: 47 },
  piernas: { x: 40, y: 72 },
};

export const ZONA_DE = {
  fc: "corazon", pa: "corazon", fr: "pulmones", spo2: "pulmones",
  temp: "cabeza", conciencia: "cabeza", sueno: "cabeza", animo: "cabeza",
  vision: "ojos", huesos: "piernas", radiacion: "abdomen", cabina: "manoDer",
};

export const PRIORIDAD_NIVEL = { bad: 0, warn: 1, info: 2 };
export { nivelAlerta, COLOR_GRAVEDAD, ORDEN_GRAVEDAD, ETIQUETA_GRAVEDAD } from "./analysis";
import { NOMBRE_SINTOMA } from "./analysis";
export const ESTADO_DE_NIVEL = { bad: "critico", warn: "atencion", info: "info", ok: "normal" };

const faltantes = new Set();

export function poseFalta(src) {
  return faltantes.has(src);
}

export function marcarFaltante(src) {
  faltantes.add(src);
}

export function srcPose(estado) {
  const src = POSES[estado] || POSES.base;
  return faltantes.has(src) ? POSES.base : src;
}

export function textoBurbuja(t, analisis, nivel) {
  const info = nivel === "info";
  const r = analisis.radiacion;
  switch (t.k) {
    case "fc":
      return { icono: "❤", texto: `HR ${t.valor ?? "—"}${info ? " · Exertion" : t.estado !== "normal" ? ` · ${t.etiqueta}` : ""}` };
    case "pa":
      return { icono: "◉", texto: `BP ${t.texto}${info ? " · Exertion" : ""}` };
    case "fr":
      return { icono: "≈", texto: `RR ${t.valor ?? "—"}${info ? " · Exertion" : ""}` };
    case "spo2":
      return { icono: "O₂", texto: `SpO₂ ${t.texto} %` };
    case "temp":
      return t.etiqueta === "Symptoms" && t.sintomas?.length ? { icono: "🌡", texto: `Symptoms: ${t.sintomas.map((x) => NOMBRE_SINTOMA[x] || x).join(", ")}` } : { icono: "🌡", texto: `Temperature ${t.texto} °C` };
    case "conciencia":
      return { icono: "✳", texto: t.texto === "Confused" ? "Confusion" : "Dizziness" };
    case "sueno":
      return { icono: "☾", texto: `Sleep ${t.texto} h` };
    case "animo":
      return { icono: "☺", texto: `Mood ${t.texto}/100` };
    case "vision":
      return { icono: "👁", texto: "Vision: check" };
    case "huesos":
      return { icono: "⌁", texto: `Exercise ${t.texto} %` };
    case "radiacion":
      return r.activo ? { icono: "☢", texto: `Storm ${r.activo.nivel} · ${r.refugio ? "in shelter" : "go to the shelter"}` } : { icono: "☢", texto: `Radiation ${Math.round(Math.max(r.pct, r.pct30) * 100)} %` };
    case "cabina":
      return { icono: "▣", texto: `CO₂ ${t.texto} ppm` };
    default:
      return { icono: "●", texto: t.nombre };
  }
}
