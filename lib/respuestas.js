export function respuestasComoObjeto(valor) {
  const r = valor?.respuestas;
  if (!Array.isArray(r)) return r && typeof r === "object" ? r : {};
  const out = {};
  for (const it of r) {
    if (!it || it.id == null) continue;
    const partes = String(it.id).split(".");
    let o = out;
    for (let i = 0; i < partes.length - 1; i++) o = o[partes[i]] = o[partes[i]] && typeof o[partes[i]] === "object" ? o[partes[i]] : {};
    o[partes.at(-1)] = it.respuesta;
  }
  return out;
}

export function textoRespuesta(v) {
  if (v == null || v === "") return "—";
  if (v === "si") return "Yes";
  if (v === "no") return "No";
  if (v === true) return "Yes";
  if (v === false) return "No";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "None";
  if (typeof v === "object") return Object.entries(v).filter(([, x]) => x != null && x !== "").map(([k, x]) => `${k}: ${Array.isArray(x) ? (x.length ? x.join(", ") : "ninguna") : typeof x === "object" ? JSON.stringify(x) : x}`).join(" · ");
  return String(v);
}
