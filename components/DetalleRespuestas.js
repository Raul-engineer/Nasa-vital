"use client";
import { ETIQUETA_NIVEL, COLOR_NIVEL } from "@/lib/fichas";
import { PRUEBAS_POR_ID, respuestasDeResultado } from "@/lib/pruebas";
import { textoRespuesta } from "@/lib/respuestas";

const hora = (iso) => (iso ? new Date(iso).toLocaleString("en-US", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");

export default function DetalleRespuestas({ fila }) {
  if (!fila) return null;
  const lista = respuestasDeResultado(fila);
  const res = fila.valor?.resultado || {};
  const origen = fila.valor?.origen === "control" ? "Phone" : "Laptop";
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm" data-detalle-respuestas={fila.prueba_id}>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="font-semibold">{PRUEBAS_POR_ID[fila.prueba_id]?.nombre || fila.prueba_id}</span>
        <span className="text-xs font-semibold" style={{ color: COLOR_NIVEL[fila.nivel] }}>{ETIQUETA_NIVEL[fila.nivel] || fila.nivel}</span>
        <span className="text-xs text-muted">{hora(fila.hecho_en)} · {origen}</span>
      </div>
      {res.texto && <p className="mb-1 text-soft">{res.texto}</p>}
      {fila.valor?.comparacion && <p className="mb-2 text-xs text-muted">{fila.valor.comparacion}</p>}
      {lista.length ? (
        <ol className="space-y-1" data-lista-respuestas>
          {lista.map((x, i) => (
            <li key={`${x.id}-${i}`} className="flex flex-wrap items-baseline gap-x-2 border-t border-white/[0.06] pt-1 first:border-0 first:pt-0" data-respuesta-id={x.id}>
              <span className="min-w-0 flex-1 text-xs text-soft">{x.pregunta}{x.minuto != null ? ` (minute ${x.minuto})` : ""}</span>
              <span className="text-xs font-semibold">{textoRespuesta(x.respuesta)}</span>
              <span className="text-[11px] tabular-nums text-muted">{new Date(x.hora).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
            </li>
          ))}
        </ol>
      ) : <p className="text-xs text-muted">No saved answers.</p>}
    </div>
  );
}
