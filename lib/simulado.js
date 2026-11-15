function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(txt) {
  let h = 2166136261;
  for (let i = 0; i < txt.length; i++) {
    h ^= txt.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function semilla(...partes) {
  return mulberry32(hash(partes.join("|")));
}

export const FASES = [
  { k: "despierto", nombre: "Awake", nivel: 3, color: "#f472b6" },
  { k: "rem", nombre: "REM", nivel: 2, color: "#22d3ee" },
  { k: "ligero", nombre: "Light", nivel: 1, color: "#60a5fa" },
  { k: "profundo", nombre: "Deep", nivel: 0, color: "#6366f1" },
];

export function hipnograma(fecha, aid, horas) {
  const h = Number(horas) || 0;
  const n = Math.max(4, Math.round(h * 4));
  const r = semilla("sueno", fecha, aid);
  const epocas = [];
  let ciclo = 0;
  while (epocas.length < n) {
    const profundo = Math.max(0, 3 - ciclo + (r() < 0.3 ? 1 : 0));
    const rem = Math.min(3, 1 + ciclo);
    const bloque = [...Array(1 + (r() < 0.5 ? 1 : 0)).fill("ligero"), ...Array(profundo).fill("profundo"), "ligero", ...Array(rem).fill("rem")];
    for (const f of bloque) {
      if (epocas.length >= n) break;
      epocas.push(r() < (h < 6.5 ? 0.09 : 0.04) ? "despierto" : f);
    }
    ciclo++;
  }
  epocas[0] = "despierto";
  const totales = Object.fromEntries(FASES.map((f) => [f.k, epocas.filter((e) => e === f.k).length / 4]));
  return { epocas, inicio: 6 - h, fin: 6, totales, horas: h };
}

export function temperatura24(fecha, aid, reposo, actual, ahora = new Date()) {
  const r = semilla("temp", fecha, aid);
  const hNow = ahora.getHours() + ahora.getMinutes() / 60;
  const circ = (hd) => 0.25 * Math.cos((2 * Math.PI * (hd - 17)) / 24);
  const base = (Number(reposo) || 36.6) - circ(hNow);
  const fin = Number(actual) || Number(reposo) || 36.6;
  const puntos = [];
  for (let i = 0; i < 25; i++) {
    const atras = 24 - i;
    const hd = hNow - atras;
    let v = base + circ(hd) + (r() - 0.5) * 0.08;
    if (atras <= 3) {
      const k = (3 - atras) / 3;
      v = v * (1 - k) + fin * k;
    }
    puntos.push({ h: atras, hora: ((Math.floor(hd) % 24) + 24) % 24, v: Math.round(v * 100) / 100 });
  }
  puntos[puntos.length - 1].v = fin;
  return puntos;
}

export function co2Horas(fecha, aid, media, horas = 6, pasoMin = 5) {
  const r = semilla("co2", fecha, aid, horas);
  const m = Number(media) || 2600;
  const n = Math.round((horas * 60) / pasoMin);
  const fase = r() * 6;
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    out.push(Math.round(m + Math.sin(fase + t * 5) * m * 0.06 + (r() - 0.5) * m * 0.04));
  }
  out[out.length - 1] = m;
  return out;
}

export function horasSobreLimite(fecha, aid, media, limite) {
  const r = semilla("co2dia", fecha, aid);
  const m = Number(media);
  if (!Number.isFinite(m)) return 0;
  const fase = r() * 24;
  let n = 0;
  for (let h = 0; h < 24; h++) if (m + Math.sin(((h + fase) / 24) * 2 * Math.PI) * m * 0.12 + (r() - 0.5) * m * 0.05 >= limite) n++;
  return n;
}

export const LIMITE_DIA_DEMO_MSV = 1.5;

export function modulosRadiacion({ tasaBase, mult = 1, fecha, aid }) {
  const r = semilla("modulos", fecha, aid);
  const base = Number(tasaBase) || 20;
  const def = [
    { k: "habitacion", nombre: "Habitation module", f: 1, icono: "bed" },
    { k: "laboratorio", nombre: "Laboratory", f: 1.15 + r() * 0.1, icono: "flask" },
    { k: "esclusa", nombre: "Spacewalk airlock", f: 1.55 + r() * 0.2, icono: "shield" },
    { k: "refugio", nombre: "Storm shelter", f: 0.15 + r() * 0.1, icono: "shield", refugio: true },
  ];
  return def.map((m) => {
    const tasa = m.refugio ? base * m.f : base * m.f * mult;
    const dia = (tasa * 24) / 1000;
    return { ...m, tasa, dia, pct: dia / LIMITE_DIA_DEMO_MSV };
  });
}
