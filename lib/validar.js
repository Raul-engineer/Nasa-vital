export const LIMITES = {
  fc: { min: 1, max: 250, nombre: "FC", unidad: "lpm" },
  spo2: { min: 50, max: 100, nombre: "SpO₂", unidad: "%" },
  sistolica: { min: 50, max: 260, nombre: "Sistólica", unidad: "mmHg" },
  diastolica: { min: 20, max: 200, nombre: "Diastólica", unidad: "mmHg" },
  temperatura: { min: 30, max: 44, nombre: "Temperatura", unidad: "°C" },
  frec_resp: { min: 1, max: 60, nombre: "FR", unidad: "rpm" },
  pvt: { min: 100, max: 5000, nombre: "Reacción", unidad: "ms" },
};

export const RANGOS_CAMPO = {
  kss: [1, 9], borg: [0, 10], dolor: [0, 10], horas: [0, 24], calidad: [1, 5], msaq: [1, 9], orina: [1, 8], minutos: [0, 600],
  fc: [1, 250], spo2: [50, 100], sistolica: [50, 260], diastolica: [20, 200], temperatura: [30, 44], frec_resp: [1, 60], segundos: [0, 30], kg: [1, 120], msv: [0, 1000],
};

export const TEXTO_SENSOR = "Revisa el sensor";
const num = (x) => (x == null || x === "" || Number.isNaN(Number(x)) ? null : Number(x));

export function validarLectura(l = {}) {
  const errores = [];
  for (const [campo, lim] of Object.entries(LIMITES)) {
    const v = num(l[campo]);
    if (v == null) continue;
    if (v < lim.min || v > lim.max) errores.push({ campo, valor: v, texto: `${TEXTO_SENSOR}: ${lim.nombre} de ${v} ${lim.unidad} no es posible. Mide de nuevo.` });
  }
  const s = num(l.sistolica), d = num(l.diastolica);
  if (s != null && d != null && d >= s) errores.push({ campo: "diastolica", valor: d, par: "sistolica", texto: `${TEXTO_SENSOR}: la diastólica (${d}) no puede ser mayor o igual que la sistólica (${s}). Repite la medición.` });
  return { ok: errores.length === 0, errores, revisaSensor: errores.length > 0, campos: [...new Set(errores.flatMap((e) => [e.campo, e.par].filter(Boolean)))] };
}

export function limpiarLectura(l = {}) {
  const v = validarLectura(l);
  if (v.ok) return { lectura: l, errores: [] };
  const limpia = { ...l };
  for (const c of v.campos) delete limpia[c];
  return { lectura: limpia, errores: v.errores };
}

export function validarCampo(tipo, valor, { obligatorio = true } = {}) {
  const v = num(valor);
  if (v == null) return obligatorio ? "Falta este dato." : null;
  const r = RANGOS_CAMPO[tipo];
  if (r && (v < r[0] || v > r[1])) return `Debe estar entre ${r[0]} y ${r[1]}.`;
  return null;
}
