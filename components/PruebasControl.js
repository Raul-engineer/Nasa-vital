"use client";
import { useState } from "react";
import { CheckinForm } from "./Pruebas";
import { CabinaTripulacion, MapaDolor } from "./PruebaPantalla";
import { COLOR_NIVEL, ETIQUETA_NIVEL } from "@/lib/fichas";
import { baseParaPrueba, CATEGORIAS_PRUEBA, contextoDisponibilidad, disponibilidad, errorDePaso, ORDEN_CATEGORIAS, pasosVisibles, PRUEBAS_CATALOGO, puedeCargarDesdeControl } from "@/lib/pruebas";
import { respuestasComoObjeto } from "@/lib/respuestas";
import { validarLectura } from "@/lib/validar";
import { guardarPrueba } from "@/lib/guardarPrueba";
import { useFichas, useHistorialPruebas } from "@/lib/useFichas";

const BTN = "min-h-12 rounded-xl border px-3 text-sm font-semibold transition active:scale-[0.98]";
const SI = "border-accent/70 bg-accent/15 text-fg";
const NO = "border-white/12 text-soft";
const REMED = [["fc", "HR", "bpm"], ["spo2", "SpO₂", "%"], ["sistolica", "Systolic", "mmHg"], ["diastolica", "Diastolic", "mmHg"]];

function Formulario({ prueba, data, analisis, historial, editar, onListo }) {
  const aid = data.astronaut.id;
  const [r, setR] = useState(() => (editar ? respuestasComoObjeto(editar.valor) : {}));
  const [horas, setHoras] = useState({});
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const set = (k, v) => {
    setR((x) => ({ ...x, [k]: v }));
    setHoras((h) => ({ ...h, [k]: new Date().toISOString() }));
  };
  const base = baseParaPrueba(prueba.id, { data, analisis, historial, excluir: editar?.id });
  const guardar = async (resp = r) => {
    for (const p of pasosVisibles(prueba, resp)) {
      if (p.tipo === "especial" && p.componente === "remedicion") {
        const d = resp.remedicion?.despues || {};
        if (REMED.some(([k]) => d[k] == null || d[k] === "")) return setError("Readings are missing.");
        const v = validarLectura(d);
        if (!v.ok) return setError(v.errores[0].texto);
        continue;
      }
      const e = errorDePaso(p, resp);
      if (e) return setError(`${p.texto ? `${p.texto}: ` : ""}${e}`);
    }
    setError(null);
    setGuardando(true);
    try {
      const { resultado } = await guardarPrueba({ prueba, respuestas: resp, horas, base, analisis, astronautId: aid, origen: "control", editar });
      onListo(resultado);
    } catch (e) {
      setError(`Could not save: ${e?.message || e}`);
    }
    setGuardando(false);
  };
  return (
    <div className="mt-3 space-y-3 border-t border-white/10 pt-3" data-formulario-control={prueba.id}>
      {pasosVisibles(prueba, r).filter((p) => p.tipo !== "info").map((p) => (
        <div key={p.id} className="space-y-1.5">
          {p.texto && <div className="text-sm text-soft">{p.texto}</div>}
          {p.tipo === "numero" && <input type="number" inputMode="decimal" step={p.paso || 1} value={r[p.id] ?? ""} onChange={(e) => set(p.id, e.target.value === "" ? "" : Number(e.target.value))} className="campo min-h-12 w-40 font-display text-xl" aria-label={p.texto} data-campo={p.id} />}
          {p.tipo === "lectura" && (
            <div className="grid grid-cols-3 gap-2">
              {p.campos.map((c) => (
                <label key={c.id} className="flex flex-col gap-1 text-xs text-muted">{c.etiqueta}
                  <input type="number" inputMode="decimal" value={r[p.id]?.[c.id] ?? ""} onChange={(e) => set(p.id, { ...(r[p.id] || {}), [c.id]: e.target.value === "" ? "" : Number(e.target.value) })} className="campo min-h-12 font-display text-lg text-fg" data-campo={`${p.id}.${c.id}`} />
                </label>
              ))}
            </div>
          )}
          {p.tipo === "escala" && (
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: p.max - p.min + 1 }, (_, k) => p.min + k).map((v) => (
                <button key={v} type="button" onClick={() => set(p.id, v)} aria-pressed={r[p.id] === v} data-valor={v}
                  className={`${BTN} min-w-12 ${r[p.id] === v ? "ring-2 ring-cyan " + SI : NO}`} style={p.colores ? { background: p.colores[v - 1], color: "#111" } : undefined}>{v}</button>
              ))}
            </div>
          )}
          {(p.tipo === "opciones" || p.tipo === "sino") && (
            <div className="flex flex-wrap gap-1.5">
              {(p.tipo === "sino" ? [["si", "Yes"], ["no", "No"]] : p.opciones).map(([v, t]) => (
                <button key={String(v)} type="button" onClick={() => set(p.id, v)} aria-pressed={r[p.id] === v} data-opcion={String(v)} className={`${BTN} ${r[p.id] === v ? SI : NO}`}>{t}</button>
              ))}
            </div>
          )}
          {p.tipo === "multi" && (
            <div className="flex flex-wrap gap-1.5">
              {p.opciones.map(([v, t]) => {
                const lista = Array.isArray(r[p.id]) ? r[p.id] : [];
                const on = lista.includes(v);
                return <button key={v} type="button" aria-pressed={on} onClick={() => set(p.id, on ? lista.filter((x) => x !== v) : [...lista, v])} className={`${BTN} ${on ? SI : NO}`}>{t}</button>;
              })}
            </div>
          )}
          {p.tipo === "hora" && <input type="time" value={r[p.id] ?? ""} onChange={(e) => set(p.id, e.target.value)} className="campo min-h-12 w-40" aria-label={p.texto} />}
          {p.tipo === "especial" && p.componente === "checkin" && (
            <CheckinForm astronautId={aid} inicial={analisis.checkinHoy} onResultado={(ev) => { const nuevo = { ...r, checkin: ev.valores || {} }; setR(nuevo); guardar(nuevo); }} />
          )}
          {p.tipo === "especial" && p.componente === "remedicion" && (
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2 text-sm text-soft">Readings after 5 min of rest</div>
              {REMED.map(([k, t, u]) => (
                <label key={k} className="flex flex-col gap-1 text-xs text-muted">{t} ({u})
                  <input type="number" inputMode="decimal" value={r.remedicion?.despues?.[k] ?? ""} onChange={(e) => {
                    const antes = { fc: analisis.hoy?.fc, spo2: analisis.hoy?.spo2, sistolica: analisis.hoy?.sistolica, diastolica: analisis.hoy?.diastolica };
                    set("remedicion", { antes, despues: { ...(r.remedicion?.despues || {}), [k]: e.target.value === "" ? "" : Number(e.target.value) } });
                  }} className="campo min-h-12 font-display text-lg text-fg" data-campo={`remedicion.${k}`} />
                </label>
              ))}
            </div>
          )}
          {p.tipo === "especial" && p.componente === "mapaDolor" && <><div className="text-sm text-soft">Where does it hurt?</div><MapaDolor valor={r.zonas} onChange={(v) => set("zonas", v)} /></>}
          {p.tipo === "especial" && p.componente === "cabinaTripulacion" && <CabinaTripulacion valor={r.tripulacion} onChange={(v) => set("tripulacion", v)} tripulacion={data.astronauts} cabina={analisis.tarjetas.find((t) => t.k === "cabina")?.cabinaHoy || {}} />}
        </div>
      ))}
      {error && <p className="text-sm font-semibold text-warn" role="alert" data-error-control>{error}</p>}
      {prueba.id !== "checkin" && <button type="button" disabled={guardando} onClick={() => guardar()} className={`${BTN} w-full border-cyan/60 bg-cyan/15 text-fg disabled:opacity-50`} data-accion="guardar-control">{guardando ? "Saving…" : editar ? "Save changes" : "Save result"}</button>}
    </div>
  );
}

export default function PruebasControl({ data, analisis }) {
  const aid = data.astronaut.id;
  const fichas = useFichas(aid);
  const { historial } = useHistorialPruebas(aid, data);
  const [cat, setCat] = useState("diario");
  const [ignorar, setIgnorar] = useState(false);
  const [abierta, setAbierta] = useState(null);
  const [aviso, setAviso] = useState(null);
  const ctx = contextoDisponibilidad({ data, analisis, eventosFicha: fichas.eventos, historial, origen: "control", ignorarIntervalo: ignorar });
  return (
    <section className="mt-5" aria-label="Tests" data-pruebas-control>
      <h2 className="etiqueta mb-2 px-1">Tests</h2>
      <div className="no-scrollbar -mx-1 mb-2 flex gap-2 overflow-x-auto px-1">
        {ORDEN_CATEGORIAS.map((c) => (
          <button key={c} type="button" onClick={() => { setCat(c); setAbierta(null); }} aria-pressed={cat === c} data-categoria-control={c} className={`${BTN} shrink-0 ${cat === c ? SI : NO}`}>{CATEGORIAS_PRUEBA[c].nombre}</button>
        ))}
      </div>
      <button type="button" role="switch" aria-checked={ignorar} onClick={() => setIgnorar((x) => !x)} data-ignorar-intervalo
        className={`mb-2 flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-medium ${ignorar ? "border-accent/70 bg-accent/15 text-fg" : "border-white/12 bg-white/[0.05] text-soft"}`}>
        <span>Ignore interval (presentation)</span>
        <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${ignorar ? "bg-accent" : "bg-white/20"}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${ignorar ? "left-[22px]" : "left-0.5"}`} /></span>
      </button>
      {aviso && <p className="mb-2 rounded-2xl border border-ok/50 bg-ok/10 px-4 py-2 text-sm font-semibold text-ok" role="status" data-aviso-control>{aviso}</p>}
      <ul className="grid gap-2">
        {PRUEBAS_CATALOGO.filter((p) => p.categoria === cat).map((p) => {
          const d = disponibilidad(p, ctx);
          const ult = [...historial].reverse().find((x) => x.prueba_id === p.id);
          return (
            <li key={p.id} className="glass px-4 py-3" data-prueba-control={p.id}>
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{p.nombre}</div>
                  <div className="text-xs text-muted">{ult ? <>Last: <span style={{ color: COLOR_NIVEL[ult.nivel] }}>{ETIQUETA_NIVEL[ult.nivel]}</span> · {ult.valor?.resultado?.texto?.slice(0, 60)}</> : "No results"}</div>
                </div>
                {puedeCargarDesdeControl(p.id) && d.permitido && (
                  <button type="button" onClick={() => setAbierta(abierta === p.id ? null : p.id)} aria-expanded={abierta === p.id} data-cargar={p.id} className={`${BTN} shrink-0 border-cyan/60 text-cyan`}>{abierta === p.id ? "Close" : d.editar ? "Edit today's" : "Load"}</button>
                )}
              </div>
              {!puedeCargarDesdeControl(p.id) ? (
                <p className="mt-1.5 text-xs text-muted" data-solo-pantalla>Done on the astronaut's screen</p>
              ) : !d.permitido ? (
                <p className="mt-1.5 text-xs text-warn" data-bloqueada-control>{d.texto}</p>
              ) : d.motivo ? (
                <p className="mt-1.5 text-xs text-cyan">{d.motivo}</p>
              ) : null}
              {abierta === p.id && puedeCargarDesdeControl(p.id) && d.permitido && (
                <Formulario key={`${p.id}-${d.editar?.id || "nuevo"}`} prueba={p} data={data} analisis={analisis} historial={historial} editar={d.editar}
                  onListo={(res) => { setAbierta(null); setAviso(`${p.nombre}: ${res.texto}`); setTimeout(() => setAviso(null), 4000); }} />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
