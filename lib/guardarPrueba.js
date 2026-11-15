"use client";
import { actualizarResultado, guardarResultado, saveCheckin, savePrueba, setEnVivo, setEnVivoVarios } from "./data";
import { evaluarPrueba } from "./analysis";
import { calificarPrueba, construirValor } from "./pruebas";

export async function guardarPrueba({ prueba, respuestas: r, horas = {}, base = {}, analisis, astronautId: aid, desde = null, origen = "laptop", editar = null }) {
  const id = prueba.id;
  const res = calificarPrueba(id, r, base);
  const valor = construirValor({ prueba, respuestas: r, horas, base, resultado: res, origen });
  const fila = editar
    ? await actualizarResultado(editar, { valor, nivel: res.nivel, hecho_en: new Date().toISOString() })
    : await guardarResultado({ astronaut_id: aid, prueba_id: id, valor, nivel: res.nivel, desde_ficha: desde });
  const leg = prueba.legado;
  if (leg === "who5" || leg === "phq9" || leg === "gad7") {
    const resp = Array.from({ length: { who5: 5, phq9: 9, gad7: 7 }[leg] }, (_, k) => Number(r[`i${k + 1}`] || 0));
    const suma = resp.reduce((a, b) => a + b, 0);
    const rr = leg === "who5" ? { respuestas: resp, bruto: suma, puntaje: suma * 4, rp: fila.id } : { respuestas: resp, puntaje: suma, item9: leg === "phq9" ? resp[8] : undefined, rp: fila.id };
    await savePrueba({ astronaut_id: aid, tipo: leg, resultado: rr, interpretacion: res.texto });
  } else if (leg === "reaccion" && r.pvt) {
    await savePrueba({ astronaut_id: aid, tipo: "reaccion", resultado: { ...r.pvt, rp: fila.id }, interpretacion: res.texto, desenlace: evaluarPrueba("reaccion", r.pvt, analisis).desenlace });
    if (r.pvt.mediana_ms) await saveCheckin({ astronaut_id: aid, tiempo_reaccion_ms: r.pvt.mediana_ms });
  } else if (leg === "amsler") {
    await savePrueba({ astronaut_id: aid, tipo: "amsler", resultado: { od: !!r.amsler?.od?.length, oi: !!r.amsler?.oi?.length, celdas: r.amsler, rp: fila.id }, interpretacion: res.texto });
  } else if (leg === "ortostatica") {
    const rr = { acostado: r.acostado, min1: r.min1, min3: r.min3, rp: fila.id };
    await savePrueba({ astronaut_id: aid, tipo: "ortostatica", resultado: rr, interpretacion: res.texto, desenlace: evaluarPrueba("ortostatica", rr, analisis).desenlace });
  } else if (leg === "remedicion" && r.remedicion) {
    const rr = { ...r.remedicion, rp: fila.id };
    await savePrueba({ astronaut_id: aid, tipo: "remedicion", resultado: rr, interpretacion: res.texto, desenlace: evaluarPrueba("remedicion", rr, analisis).desenlace });
  }
  if (id === "presion_pronam" && res.detalles?.promedio) await savePrueba({ astronaut_id: aid, tipo: "presion", resultado: { ...res.detalles.promedio, rp: fila.id }, interpretacion: res.texto });
  if (id === "spo2_confirmacion" && r.oximetro != null) await setEnVivo(aid, "spo2", Number(r.oximetro));
  if (id === "diario_sueno" && res.valor != null) await setEnVivo(aid, "horas_sueno", res.valor);
  if (id === "amt4" && res.detalles?.confusion) await saveCheckin({ astronaut_id: aid, confusion: true });
  if (id === "cabina_tripulacion") for (const x of res.detalles?.conDolor || []) await setEnVivo(x, "dolor_cabeza", true);
  const vivo = prueba.aVivo?.(r, base);
  if (vivo && Object.values(vivo).every((x) => x != null && Number.isFinite(x))) await setEnVivoVarios(aid, vivo);
  return { fila, resultado: res };
}
