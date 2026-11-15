"use client";
import { useState } from "react";
import CyberButton from "@/components/CyberButton";
import { COLOR_NIVEL, ETIQUETA_NIVEL, limpiarRespuestas, obtenerFicha, preguntasDe, RESPUESTAS, textoPaso, TITULOS } from "@/lib/fichas";
import { useFichas, useResultados } from "@/lib/useFichas";
import { leerNota, textoMotivo } from "@/lib/motivos";
import { PRUEBAS_POR_ID } from "@/lib/pruebas";
import DetalleRespuestas from "@/components/DetalleRespuestas";

const CIERRE = { resuelto: "Resolved", escalado: "Escalated", cancelado: "Cancelled" };
const fecha = (iso) => (iso ? new Date(iso).toLocaleString("en-US", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");
const hora = (iso) => (iso ? new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—");

function armar(e, pasos, medicamentos, resultados = []) {
  const m = e.respuestas?._m || {};
  const ficha = obtenerFicha(e.clave, { rama: m.rama });
  const preguntas = preguntasDe(e.clave);
  const r = limpiarRespuestas(e.respuestas);
  const respuestas = Object.entries(r).map(([id, v]) => ({ texto: preguntas.find((p) => p.id === id)?.texto || id, valor: RESPUESTAS[v] }));
  const causas = String(e.causa || "").split(",").filter(Boolean).map((id) => ficha?.causas.find((c) => c.id === id)?.nombre || id);
  const propios = pasos.filter((p) => p.evento_id === e.id).map((p) => {
    const n = leerNota(p.nota);
    const base = String(p.paso_id).split("~")[0];
    const alt = String(p.paso_id).includes("~") ? notasAlt(pasos, e.id, base) : null;
    return { texto: alt || textoPaso(e.clave, base), hora: hora(p.marcado_en), por: p.marcado_por, nota: p.nota, motivo: n ? `${textoMotivo(n.motivo)}${n.alt ? ` → ${n.alt.texto}` : ""}${n.posponer ? ` · postponed ${n.posponer} min` : ""}${n.hora ? ` · taken at ${n.hora}` : ""}` : null };
  });
  const pruebas = resultados.filter((r) => r.desde_ficha === e.clave && r.hecho_en >= e.abierto_en && (!e.cerrado_en || r.hecho_en <= e.cerrado_en)).map((r) => ({ nombre: PRUEBAS_POR_ID[r.prueba_id]?.nombre || r.prueba_id, texto: r.valor?.resultado?.texto || "", nivel: r.nivel, hora: hora(r.hecho_en), fila: r }));
  const fin = e.cerrado_en ? Date.parse(e.cerrado_en) : Date.now();
  const meds = medicamentos.filter((x) => Date.parse(x.tomado_en) >= Date.parse(e.abierto_en) && Date.parse(x.tomado_en) <= fin).map((x) => ({ nombre: x.nombre, hora: hora(x.tomado_en) }));
  const estado = e.cerrado_en ? CIERRE[e.cierre] || e.cierre : (m.escalados || []).length ? "Escalated · open" : "Open";
  return { e, m, titulo: ficha?.titulo || TITULOS[e.clave] || e.clave, respuestas, causas, pasos: propios, meds, estado, combinaciones: e.combinaciones || [], pruebas };
}

function notasAlt(pasos, eventoId, base) {
  const n = pasos.filter((p) => p.evento_id === eventoId && p.paso_id === base).map((p) => leerNota(p.nota)).filter((x) => x?.alt).at(-1);
  return n?.alt?.texto || null;
}

function comoTexto(items, nombre) {
  const out = [`Card log · ${nombre}`, ""];
  for (const x of items) {
    out.push(`${fecha(x.e.abierto_en)} · ${x.titulo} · ${ETIQUETA_NIVEL[x.e.nivel] || x.e.nivel} · ${x.estado}${x.e.cerrado_en ? ` (${hora(x.e.cerrado_en)})` : ""}`);
    if (x.causas.length) out.push(`  Main cause: ${x.causas.join(" and ")}`);
    if (x.respuestas.length) out.push(`  Survey: ${x.respuestas.map((r) => `${r.texto} ${r.valor}`).join(" | ")}`);
    if (x.combinaciones.length) out.push(`  Combinations: ${x.combinaciones.map((c) => c.titulo).join(", ")}`);
    if (x.pasos.length) out.push(`  Steps: ${x.pasos.map((p) => `${p.hora} ${p.texto}${p.motivo ? ` (could not: ${p.motivo})` : ""}`).join(" | ")}`);
    if (x.pruebas.length) out.push(`  Tests: ${x.pruebas.map((p) => `${p.hora} ${p.nombre}: ${p.texto}`).join(" | ")}`);
    if (x.meds.length) out.push(`  Medications: ${x.meds.map((m) => `${m.hora} ${m.nombre}`).join(", ")}`);
    out.push("");
  }
  return out.join("\n");
}

function PruebaRegistro({ p }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <div className="text-xs">
      <button type="button" onClick={() => setAbierto((x) => !x)} aria-expanded={abierto} className="text-left hover:text-fg" data-abrir-detalle={p.fila.prueba_id}>
        <span className="tabular-nums text-muted">{p.hora}</span> {p.nombre}: {p.texto} <span className="text-cyan">{abierto ? "· hide answers" : "· show answers"}</span>
      </button>
      {abierto && <div className="mt-1.5"><DetalleRespuestas fila={p.fila} /></div>}
    </div>
  );
}

export function Registro({ aid, nombre }) {
  const db = useFichas(aid);
  const res = useResultados(aid);
  const [copiado, setCopiado] = useState(false);
  const items = db.eventos.map((e) => armar(e, db.pasos, db.medicamentos, res.lista));
  const copiar = async () => {
    const txt = comoTexto(items, nombre);
    try {
      await navigator.clipboard.writeText(txt);
    } catch {
      const t = document.createElement("textarea");
      t.value = txt;
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      t.remove();
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };
  if (!db.listo) return <div className="py-10 text-center text-muted">Loading log…</div>;
  return (
    <section aria-label="Log" data-registro>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">{items.length ? `${items.length} ${items.length === 1 ? "card" : "cards"} in the log` : "No cards opened yet."}</p>
        {items.length > 0 && <CyberButton onClick={copiar} tam="sm" texto={copiado ? "Copied" : "Copy report"} data-accion="copiar-registro">{copiado ? "✓ Copied" : "Copy report"}</CyberButton>}
      </div>
      <ol className="relative space-y-3 border-l border-white/12 pl-5">
        {items.map((x) => {
          const c = COLOR_NIVEL[x.e.nivel] || COLOR_NIVEL.moderado;
          return (
            <li key={x.e.id} className="glass relative px-4 py-3" data-evento={x.e.clave}>
              <span className="absolute -left-[27px] top-4 h-3 w-3 rounded-full" style={{ background: c, boxShadow: `0 0 10px ${c}` }} />
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-xs tabular-nums text-muted">{fecha(x.e.abierto_en)}</span>
                <span className="font-display font-semibold">{x.titulo}</span>
                <span className="rounded-full border px-2 py-0.5 text-[11px] font-semibold" style={{ color: c, borderColor: `color-mix(in oklab, ${c} 55%, transparent)` }}>{ETIQUETA_NIVEL[x.e.nivel] || x.e.nivel}</span>
                <span className={`ml-auto text-xs font-semibold ${x.e.cierre === "resuelto" ? "text-ok" : x.e.cerrado_en ? "text-muted" : "text-warn"}`}>{x.estado}{x.e.cerrado_en ? ` · ${hora(x.e.cerrado_en)}` : ""}</span>
              </div>
              <dl className="mt-2 grid gap-1.5 text-sm min-[900px]:grid-cols-[150px_1fr]">
                {x.causas.length > 0 && <><dt className="text-muted">Main cause</dt><dd>{x.causas.join(" and ")}</dd></>}
                {x.respuestas.length > 0 && <><dt className="text-muted">Survey</dt><dd className="space-y-0.5">{x.respuestas.map((r) => <div key={r.texto} className="text-xs"><span className="text-soft">{r.texto}</span> <b>{r.valor}</b></div>)}</dd></>}
                {x.combinaciones.length > 0 && <><dt className="text-muted">Combinations</dt><dd className="text-xs">{x.combinaciones.map((c) => c.titulo).join(" · ")}</dd></>}
                {x.pasos.length > 0 && <><dt className="text-muted">Steps</dt><dd className="space-y-0.5">{x.pasos.map((p, i) => <div key={i} className="text-xs"><span className="tabular-nums text-muted">{p.hora}</span> {p.texto}{p.motivo ? <span className="text-warn"> · could not: {p.motivo}</span> : ""}{p.por === "control" ? <span className="text-muted"> · from the phone</span> : ""}</div>)}</dd></>}
                {x.pruebas.length > 0 && <><dt className="text-muted">Tests</dt><dd className="space-y-0.5">{x.pruebas.map((p, i) => <PruebaRegistro key={i} p={p} />)}</dd></>}
                {x.meds.length > 0 && <><dt className="text-muted">Medications</dt><dd className="text-xs">{x.meds.map((m) => `${m.hora} ${m.nombre}`).join(" · ")}</dd></>}
              </dl>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
