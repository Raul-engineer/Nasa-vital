"use client";
import "./cyber-medic.css";
import "./cyber-estilo.css";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import CyberButton from "./CyberButton";
import { abrirEventoFicha, actualizarEventoFicha, cerrarEventoFicha, desmarcarPaso, guardarRespuestas, marcarPaso, medirPresion, registrarMedicamento, setEnVivo, setEnVivoTripulacion, setEnVivoVarios } from "@/lib/data";
import {
  CAMPOS_REMEDIR, CATEGORIA_FICHA, COLOR_NIVEL, contextoFicha, ETIQUETA_NIVEL, evaluarRemedicion, lecturaDeContexto, limpiarRespuestas, mayorNivel,
  mostrarPruebaCompleta, notasDeEvento, NOTA_BOTIQUIN, preguntasDe, RESPUESTAS, subirNivel, TEXTO_NO_LIBRE, TITULOS,
} from "@/lib/fichas";
import { contarMotivo, motivosDe, notaMotivo, resolverMotivo, textoMotivo } from "@/lib/motivos";
import { PRUEBAS_POR_ID } from "@/lib/pruebas";
import { validarLectura } from "@/lib/validar";
import { entradaCombinaciones, evaluarConCombinaciones } from "@/lib/combinaciones";
import { pasosHechos } from "@/lib/escalamiento";
import { partesFuente } from "@/lib/fuentes";
import { useFichas, useResultados, useTripulacion } from "@/lib/useFichas";
import { useQuickFix } from "@/lib/useQuickFix";

const REUSO_MIN = 30;
const hora = (iso) => (iso ? new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—");

const GUARDAR_REMEDIR = { fc: "fc", frec_resp: "frec_resp", spo2: "spo2", temperatura: "temperatura", who5: "who5", reaccion: "reaccion", huesosPct: "ejercicio_pct" };

function Nivel({ nivel, grande = false, etiqueta = null }) {
  const c = COLOR_NIVEL[nivel] || COLOR_NIVEL.moderado;
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border font-semibold ${grande ? "px-3 py-1.5 text-sm" : "px-2 py-0.5 text-[11px]"}`}
      style={{ color: c, borderColor: `color-mix(in oklab, ${c} 55%, transparent)`, background: `color-mix(in oklab, ${c} 12%, transparent)` }} data-nivel-ficha={nivel}>
      <span className="dot-estado" style={{ width: 6, height: 6 }} />
      {etiqueta || ETIQUETA_NIVEL[nivel] || nivel}
    </span>
  );
}

function Seccion({ titulo, children, extra }) {
  return (
    <section className="ficha-seccion border-t border-white/10 px-5 py-4">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h3 className="etiqueta">{titulo}</h3>
        {extra}
      </div>
      {children}
    </section>
  );
}

function Fuentes({ ids }) {
  const partes = partesFuente([...new Set(ids)].join(","));
  if (!partes.length) return null;
  return (
    <p className="text-[11px] leading-relaxed text-[#8f838a]">
      Based on: {partes.map((p, i) => (
        <span key={p.texto}>
          {i > 0 && " · "}
          {p.url ? <a href={p.url} target="_blank" rel="noreferrer" className="underline decoration-dotted hover:text-soft">{p.texto}</a> : p.texto}
        </span>
      ))}
    </p>
  );
}

function useFlip(firma) {
  const nodos = useRef(new Map());
  const prev = useRef(new Map());
  useLayoutEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    nodos.current.forEach((el, k) => {
      const top = el.offsetTop;
      const antes = prev.current.get(k);
      if (!reduce && antes != null && antes !== top && el.animate) el.animate([{ transform: `translateY(${antes - top}px)` }, { transform: "none" }], { duration: 260, easing: "cubic-bezier(.2,.7,.2,1)" });
      prev.current.set(k, top);
    });
  }, [firma]);
  return (k) => (el) => {
    if (el) nodos.current.set(k, el);
    else nodos.current.delete(k);
  };
}

function useReloj(activo) {
  const [t, setT] = useState(() => Date.now());
  useEffect(() => {
    if (!activo) return;
    const i = setInterval(() => setT(Date.now()), 1000);
    return () => clearInterval(i);
  }, [activo]);
  return t;
}

function Cuenta({ limite, ahora }) {
  const ms = limite - ahora;
  if (ms <= 0) return <span className="font-semibold text-crit">Expired</span>;
  const s = Math.ceil(ms / 1000);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
  const txt = h ? `${h} h ${String(m).padStart(2, "0")} min` : `${m}:${String(ss).padStart(2, "0")}`;
  return <span className="tabular-nums text-soft">{txt}</span>;
}

function Encuesta({ ev, onResponder, editando, setEditando, bloqueada }) {
  const lista = ev.preguntas;
  if (!lista.length) return null;
  const actual = (editando && lista.find((p) => p.id === editando)) || ev.siguiente;
  const i = actual ? lista.indexOf(actual) : lista.length;
  const pct = Math.round((ev.progreso.hechas / Math.max(1, ev.progreso.total)) * 100);
  return (
    <div data-encuesta>
      <div className="mb-3 flex items-center gap-3 text-xs text-muted">
        <span className="tabular-nums">{actual ? `${i + 1}/${lista.length}` : `${lista.length}/${lista.length}`}</span>
        <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <span className="absolute inset-y-0 left-0 rounded-full bg-cyan transition-[width] duration-300" style={{ width: `${pct}%` }} />
        </span>
      </div>
      {actual ? (
        <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-4" data-pregunta={actual.id}>
          <p className="mb-3 text-[15px] font-medium leading-snug">{actual.texto}</p>
          <div className="grid grid-cols-3 gap-2">
            {["si", "no", "nose"].map((v) => (
              <button key={v} type="button" disabled={bloqueada} onClick={() => { onResponder(actual.id, v); setEditando(null); }} data-respuesta={v}
                className={`min-h-12 rounded-xl border px-3 text-[15px] font-semibold transition active:scale-[0.98] disabled:opacity-40 ${ev.respuestas[actual.id] === v ? "border-cyan bg-cyan/20 text-fg" : "border-white/15 bg-white/[0.06] text-soft hover:bg-white/[0.12]"}`}>
                {RESPUESTAS[v]}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-ok">Survey complete.</p>
      )}
      <ol className="mt-3 space-y-1">
        {lista.filter((p) => p.id in ev.respuestas && p !== actual).map((p) => (
          <li key={p.id}>
            <button type="button" onClick={() => setEditando(p.id)} className="flex w-full items-start gap-2 rounded-lg px-2 py-1 text-left text-xs text-muted hover:bg-white/[0.05]">
              <span className="min-w-0 flex-1">{p.texto}</span>
              <span className="shrink-0 font-semibold text-soft">{RESPUESTAS[ev.respuestas[p.id]]}{ev.autos.has(p.id) ? " · from your data" : ""}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Causas({ ev }) {
  const firma = ev.causas.map((c) => `${c.id}:${c.puntos}`).join(",");
  const ref = useFlip(firma);
  const max = Math.max(1, ...ev.causas.map((c) => c.puntos));
  const principales = new Set(ev.principales.map((c) => c.id));
  return (
    <ol className="relative space-y-2" data-causas>
      {ev.causas.map((c) => {
        const top = principales.has(c.id);
        return (
          <li key={c.id} ref={ref(c.id)} data-causa={c.id} className={`rounded-xl border px-3 py-2.5 ${top ? "border-accent/60 bg-accent/10" : "border-white/10 bg-white/[0.03]"} ${c.descartarAntes ? "opacity-60" : ""}`}>
            <div className="flex items-center gap-2">
              <span className={`min-w-0 flex-1 text-sm font-semibold ${top ? "text-fg" : "text-soft"}`}>{c.nombre}</span>
              {c.descartarAntes && <span className="text-[11px] text-warn">Rule out another cause first</span>}
              <span className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-white/10">
                <span className="block h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${Math.max(0, (c.puntos / max) * 100)}%` }} />
              </span>
            </div>
            <p className="mt-1 text-xs leading-snug text-muted">{c.porque}</p>
          </li>
        );
      })}
    </ol>
  );
}

function Paso({ paso, hecho, nota, alt, limite, ahora, onToggle, onToggleAlt, onNoPuedo, onAbrir, deshabilitado }) {
  const [menu, setMenu] = useState(false);
  const [pidiendoHora, setPidiendoHora] = useState(false);
  const [horaTome, setHoraTome] = useState("");
  if (paso.abrir)
    return (
      <li className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
        <span className="min-w-0 flex-1 text-sm">{paso.texto}</span>
        <button type="button" onClick={() => onAbrir?.(paso.abrir)} className="min-h-11 shrink-0 rounded-xl border border-cyan/50 px-3 text-sm font-semibold text-cyan hover:bg-cyan/10">Open</button>
      </li>
    );
  const visible = alt || paso;
  const bloqueado = nota?.motivo === "ya_tome";
  return (
    <li className={`rounded-xl border px-3 py-2 ${hecho ? "border-ok/40 bg-ok/[0.07]" : nota ? "border-warn/40 bg-warn/[0.06]" : "border-white/10 bg-white/[0.03]"}`} data-paso={paso.id} data-tipo={paso.tipo} data-alterno={alt ? alt.id : undefined}>
      <div className="flex items-start gap-3">
        <button type="button" role="checkbox" aria-checked={!!hecho} disabled={deshabilitado || bloqueado} onClick={alt ? onToggleAlt : onToggle} aria-label={visible.texto}
          className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border-2 text-sm font-bold transition disabled:opacity-40 ${hecho ? "border-ok bg-ok text-[#10241a]" : "border-white/35 hover:border-white/60"}`}>
          {hecho ? "✓" : ""}
        </button>
        <div className="min-w-0 flex-1">
          <div className={`text-sm leading-snug ${hecho ? "text-muted line-through decoration-white/30" : ""}`}>
            {visible.obligatorio && <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-crit align-middle" title="Required" aria-label="Required" />}
            {visible.texto}
          </div>
          {alt && <div className="mt-0.5 text-xs text-muted line-through decoration-white/20">{paso.texto}</div>}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            {(alt ? alt.minutos : paso.minutos) != null && !hecho && limite && <span className="text-muted">Time: <Cuenta limite={limite} ahora={ahora} /></span>}
            {paso.href && !alt && <Link href={paso.href} className="font-semibold text-cyan hover:underline">Go to the test</Link>}
            {nota && <span className="text-warn" data-motivo={nota.motivo}>{textoMotivo(nota.motivo)}{nota.posponer ? ` · postponed ${nota.posponer} min` : ""}{nota.hora ? ` · taken at ${nota.hora}: do not repeat` : ""}{nota.cola ? " · report queued" : ""}</span>}
            {!hecho && !deshabilitado && !bloqueado && (
              <button type="button" onClick={() => setMenu((x) => !x)} className="text-muted underline decoration-dotted hover:text-soft">I can't do this step</button>
            )}
          </div>
          {menu && (
            <div className="mt-2 flex flex-wrap gap-2" data-motivos>
              {motivosDe(paso).map((m) => (
                <button key={m.id} type="button" data-motivo-opcion={m.id} onClick={() => { setMenu(false); if (m.id === "ya_tome") setPidiendoHora(true); else onNoPuedo(m.id); }} className="min-h-11 rounded-xl border border-white/15 px-3 text-xs font-semibold text-soft hover:bg-white/10">{m.texto}</button>
              ))}
            </div>
          )}
          {pidiendoHora && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <label className="text-xs text-muted">What time did you take it? <input type="time" value={horaTome} onChange={(e) => setHoraTome(e.target.value)} className="campo ml-1 min-h-11" /></label>
              <button type="button" disabled={!horaTome} onClick={() => { setPidiendoHora(false); onNoPuedo("ya_tome", { hora: horaTome }); }} className="min-h-11 rounded-xl border border-white/15 px-3 text-xs font-semibold text-soft hover:bg-white/10 disabled:opacity-40">Save time</button>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

function alergiaDe(med, alergias = []) {
  const n = med.nombre.toLowerCase();
  for (const a of alergias || []) {
    const s = String(a?.sustancia || a || "").toLowerCase();
    if (!s) continue;
    if (n.includes(s.split(" ")[0]) || (med.grupo === "penicilina" && /penicilina|amoxicilina|penicillin|amoxicillin/.test(s)) || (med.grupo === "aine" && /ibuprofeno|aine|ibuprofen|nsaid/.test(s))) return a.sustancia || s;
  }
  return null;
}

function Remedir({ clave, ev, contexto, inicial, onResultado, deshabilitado }) {
  const campos = CAMPOS_REMEDIR[clave] || [];
  const actual = lecturaDeContexto(contexto);
  const [vals, setVals] = useState({});
  const [res, setRes] = useState(null);
  const [error, setError] = useState(null);
  const comparar = (usarActual) => {
    const nueva = usarActual ? actual : Object.fromEntries(campos.map((c) => [c.campo, vals[c.campo] === "" || vals[c.campo] == null ? null : Number(String(vals[c.campo]).replace(",", "."))]));
    const v = validarLectura(nueva);
    if (!usarActual && !v.ok) {
      setError(v.errores[0].texto);
      setRes(null);
      return;
    }
    setError(null);
    const r = evaluarRemedicion(clave, contexto, nueva, inicial);
    setRes(r.resultado);
    onResultado(r, nueva, usarActual);
  };
  const r = ev.ficha.remedir || {};
  return (
    <div data-remedir>
      <p className="mb-3 text-sm text-soft">{r.minutos ? `Measure again in ${r.minutos >= 60 ? `${Math.round(r.minutos / 60)} h` : `${r.minutos} min`}. ` : ""}It closes if: {r.cierra}.</p>
      {campos.length > 0 && (
        <div className="mb-3 grid grid-cols-2 gap-2">
          {campos.map((c) => (
            <label key={c.campo} className="flex flex-col gap-1 text-xs text-muted">
              {c.etiqueta} ({c.unidad})
              <input type="number" inputMode="decimal" step={c.paso || 1} value={vals[c.campo] ?? ""} placeholder={actual[c.campo] != null ? String(actual[c.campo]) : ""} disabled={deshabilitado}
                onChange={(e) => setVals((v) => ({ ...v, [c.campo]: e.target.value }))} className="campo min-h-12 font-display text-lg font-semibold" />
            </label>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {campos.length > 0 && <CyberButton onClick={() => comparar(false)} disabled={deshabilitado || campos.every((c) => vals[c.campo] == null || vals[c.campo] === "")} texto="Compare">Compare</CyberButton>}
        <CyberButton onClick={() => comparar(true)} disabled={deshabilitado} tam="sm" texto="Use the latest reading">Use the latest reading</CyberButton>
      </div>
      {error && <p className="mt-3 text-sm font-semibold text-warn" data-revisa-sensor>{error}</p>}
      {res && (
        <p className={`mt-3 text-sm font-semibold ${res === "resuelto" ? "text-ok" : res === "peor" ? "text-crit" : "text-warn"}`} data-resultado-remedir={res}>
          {res === "resuelto" ? "Back in your range: resolved." : res === "peor" ? "Worse: it goes up one level. Check the danger signs." : "No change: keep following the plan."}
        </p>
      )}
    </div>
  );
}

function reusar(respuestas, clave) {
  const peligro = new Set(preguntasDe(clave).filter((p) => p.peligro).map((p) => p.id));
  return Object.fromEntries(Object.entries(limpiarRespuestas(respuestas)).filter(([k]) => !peligro.has(k)));
}

export default function Ficha({ clave, astronautId, data: dataExt = null, analisis: anExt = null, onClose, onAbrir, quien = "astronauta" }) {
  const propio = useQuickFix(dataExt ? null : astronautId);
  const data = dataExt || propio.data;
  const analisis = anExt || propio.analisis;
  const aid = data?.astronaut?.id ?? astronautId;
  const db = useFichas(aid);
  const resultados = useResultados(aid);
  const ids = useMemo(() => (data?.astronauts || []).map((a) => a.id), [data?.astronauts]);
  const trip = useTripulacion(ids, !!clave);
  const ahora = useReloj(!!clave);
  const [borrador, setBorrador] = useState({});
  const [optimista, setOptimista] = useState(null);
  const [editando, setEditando] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const creando = useRef(false);
  const cerradoAqui = useRef(false);
  const panel = useRef(null);

  useEffect(() => {
    setBorrador({});
    setEditando(null);
    setMensaje(null);
    cerradoAqui.current = false;
    panel.current?.scrollTo?.({ top: 0 });
  }, [clave, aid]);

  useEffect(() => {
    if (!clave) return;
    const f = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [clave, onClose]);

  const abiertos = db.eventos.filter((e) => !e.cerrado_en);
  const evento = abiertos.find((e) => e.clave === clave) || null;
  const respuestas = evento ? (optimista?.id === evento.id ? optimista.r : evento.respuestas || {}) : borrador;
  const m = respuestas._m || {};

  const calc = useMemo(() => {
    if (!clave || !analisis || !data) return null;
    const contexto = contextoFicha(clave, analisis, data, { oximetro: m.oximetro, nivelMinimo: evento ? mayorNivel(evento.nivel, m.nivelMin || "ok") : null, rama: m.rama, resultados: resultados.lista, desde: evento?.abierto_en });
    const todas = Object.fromEntries(abiertos.filter((e) => e.clave !== clave).map((e) => [e.clave, e.respuestas || {}]));
    const causas = Object.fromEntries(abiertos.map((e) => [e.clave, String(e.causa || "").split(",")[0] || null]));
    const entrada = entradaCombinaciones({ analisis, data, tripulacion: trip, medicamentos: db.medicamentos, medicamentosTripulacion: db.medicamentosTripulacion, respuestas: todas, causas, oximetro: m.oximetro });
    const { ficha, combinaciones } = evaluarConCombinaciones(clave, { contexto, respuestas, todas, entrada });
    return { contexto, ficha, combinaciones };
  }, [clave, analisis, data, respuestas, abiertos, evento?.nivel, trip, db.medicamentos, db.medicamentosTripulacion, resultados.lista]);

  const ev = calc?.ficha;
  const causaTxt = ev ? ev.principales.map((c) => c.id).join(",") : "";
  const combosTxt = ev ? ev.combinaciones.map((c) => c.id).join(",") : "";

  useEffect(() => {
    if (!ev || !db.listo || evento || creando.current || cerradoAqui.current || ev.nivel === "ok") return;
    if (db.eventos.some((e) => e.clave === clave && e.cerrado_en && Date.now() - Date.parse(e.cerrado_en) < 6e4)) return;
    creando.current = true;
    const reciente = db.eventos.find((e) => e.clave === clave && e.cerrado_en && Date.now() - Date.parse(e.cerrado_en) < REUSO_MIN * 6e4);
    const propias = limpiarRespuestas(borrador);
    const base = Object.keys(propias).length || !reciente ? { ...borrador } : reusar(reciente.respuestas, clave);
    abrirEventoFicha({
      astronaut_id: aid, clave, nivel: ev.nivel, causa: causaTxt || null,
      respuestas: { ...base, _m: { nivelInicial: ev.nivel, rama: ev.rama, modo: ev.modo, toque: new Date().toISOString(), lecturaInicial: lecturaDeContexto(calc.contexto), reusado: reciente ? reciente.id : null, alerta: !!calc.contexto.tormentaActiva, peligroActivo: ev.peligros.length > 0 } },
      combinaciones: ev.combinaciones,
    })
      .then(() => db.refresh())
      .catch((e) => setMensaje(`Could not open the log: ${e?.message || e}`))
      .finally(() => { creando.current = false; });
  }, [ev?.nivel, db.listo, evento?.id, clave, aid]);

  const firma = ev && evento ? `${ev.nivel}|${causaTxt}|${combosTxt}|${ev.modo}|${ev.peligros.length > 0}|${!!calc.contexto.tormentaActiva}` : null;
  const firmaEvento = evento ? `${evento.nivel}|${evento.causa || ""}|${(evento.combinaciones || []).map((c) => c.id).join(",")}|${m.modo}|${!!m.peligroActivo}|${!!m.alerta}` : null;
  useEffect(() => {
    if (!firma || !evento || firma === firmaEvento) return;
    const nivel = mayorNivel(ev.nivel, m.nivelMin || "ok");
    actualizarEventoFicha(evento.id, {
      nivel, causa: causaTxt || null, combinaciones: ev.combinaciones,
      respuestas: { ...respuestas, _m: { ...(respuestas._m || {}), modo: ev.modo, peligroActivo: ev.peligros.length > 0, alerta: !!calc.contexto.tormentaActiva, huboAlarma: m.huboAlarma || ev.modo === "alarma" } },
    }).catch(() => {});
  }, [firma, firmaEvento]);

  if (!clave) return null;

  const cerrar = () => onClose?.();
  const toque = (r) => ({ ...r, _m: { ...(r._m || {}), toque: new Date().toISOString() } });
  const guardar = async (r) => {
    if (!evento) {
      setBorrador(r);
      return;
    }
    setOptimista({ id: evento.id, r });
    try {
      await guardarRespuestas(evento.id, r);
      await db.refresh();
    } catch (e) {
      setMensaje(`Could not save: ${e?.message || e}`);
    }
    setOptimista(null);
  };
  const responder = (pid, valor) => guardar(toque({ ...respuestas, [pid]: valor }));
  const marcarPeligro = (id) => guardar(toque({ ...respuestas, _peligro: id }));
  const quitarPeligro = () => {
    const r = { ...respuestas };
    delete r._peligro;
    guardar(toque({ ...r, _m: { ...(r._m || {}), peor: false } }));
  };

  const pasosEv = evento ? db.pasos.filter((p) => p.evento_id === evento.id) : [];
  const hechos = pasosHechos(pasosEv);
  const notas = notasDeEvento(pasosEv);
  const notaDe = (id) => notas.filter((n) => n.paso === id).at(-1) || null;
  const altDe = (id) => notas.filter((n) => n.paso === id && n.alt).at(-1)?.alt || null;
  const inicio = evento ? Date.parse(evento.abierto_en) : ahora;
  const limiteDe = (p) => {
    const a = altDe(p.id);
    if (a?.minutos) return Date.parse(notas.filter((n) => n.paso === p.id && n.alt).at(-1).t) + a.minutos * 6e4;
    if (p.minutos == null) return null;
    const pos = notas.filter((n) => n.paso === p.id && n.posponer).reduce((x, n) => x + n.posponer, 0);
    return inicio + (p.minutos + pos) * 6e4;
  };
  const alternar = async (paso) => {
    if (!evento) return;
    const filas = pasosEv.filter((p) => p.paso_id === paso.id);
    try {
      if (hechos.has(paso.id)) await Promise.all(filas.map((f) => desmarcarPaso(f.id)));
      else await marcarPaso(evento.id, paso.id, { marcado_por: quien });
      await guardarRespuestas(evento.id, toque(evento.respuestas || {}));
      await db.refresh();
    } catch (e) {
      setMensaje(`Could not check it: ${e?.message || e}`);
    }
  };
  const alternarAlt = async (paso) => {
    const a = altDe(paso.id);
    if (!evento || !a) return;
    try {
      const filas = pasosEv.filter((p) => p.paso_id === a.id);
      if (filas.length) await Promise.all(filas.map((f) => desmarcarPaso(f.id)));
      else await marcarPaso(evento.id, a.id, { marcado_por: quien });
      await guardarRespuestas(evento.id, toque(evento.respuestas || {}));
      await db.refresh();
    } catch (e) {
      setMensaje(`Could not check it: ${e?.message || e}`);
    }
  };
  const noPuedo = async (paso, motivo, extra = {}) => {
    if (!evento) return;
    const res = resolverMotivo(paso, motivo, { previos: contarMotivo(notas, paso.id, motivo), alternativaBotiquin: ev.botiquin.find((b) => b.libre)?.nombre || null });
    try {
      await marcarPaso(evento.id, paso.id, { nota: notaMotivo(paso, res, extra), marcado_por: quien });
      const mm = { ...(evento.respuestas?._m || {}) };
      const t = new Date().toISOString();
      let nivelNuevo = null;
      if (res.mostrarPeligro) mm.peor = true;
      if (res.escalar) {
        const actual = mayorNivel(ev.nivel, mm.nivelMin || "ok");
        nivelNuevo = res.escalar === "subir" ? subirNivel(actual) : mayorNivel(actual, res.escalar);
        mm.nivelMin = nivelNuevo;
      }
      if (res.escalar || res.avisoOficial) mm.avisos = [...(mm.avisos || []), { id: `motivo.${paso.id}.${Date.now()}`, t, nivel: nivelNuevo || ev.nivel, sonar: !!res.escalar, texto: `${TITULOS[clave]}: ${textoMotivo(motivo).toLowerCase()} on "${paso.texto}". ${res.avisoOficial ? "Notice to the medical officer." : ""}${nivelNuevo ? ` Goes up to ${ETIQUETA_NIVEL[nivelNuevo]}.` : ""}` }].slice(-30);
      await actualizarEventoFicha(evento.id, { ...(nivelNuevo ? { nivel: nivelNuevo } : {}), respuestas: toque({ ...(evento.respuestas || {}), _m: mm }) });
      await db.refresh();
      setMensaje(res.texto);
      if (res.abrir && onAbrir) setTimeout(() => onAbrir(res.abrir), 600);
    } catch (e) {
      setMensaje(`Could not save: ${e?.message || e}`);
    }
  };
  const tome = async (nombre) => {
    try {
      await registrarMedicamento(aid, nombre);
      await db.refresh();
      setMensaje(`Recorded: ${nombre} · ${hora(new Date().toISOString())}`);
    } catch (e) {
      setMensaje(`Could not record it: ${e?.message || e}`);
    }
  };
  const guardarLectura = async (nueva) => {
    const valores = Object.fromEntries(Object.entries(nueva || {}).filter(([, v]) => v != null && Number.isFinite(v)));
    if (clave === "pa" && valores.sistolica != null && valores.diastolica != null) return medirPresion(aid, valores.sistolica, valores.diastolica);
    if (clave === "cabina" && valores.co2_ppm != null) return setEnVivoTripulacion(ids, { co2_ppm: valores.co2_ppm });
    const vivo = Object.fromEntries(Object.entries(valores).filter(([k]) => GUARDAR_REMEDIR[k]).map(([k, v]) => [GUARDAR_REMEDIR[k], v]));
    if (Object.keys(vivo).length) return setEnVivoVarios(aid, vivo);
  };
  const alRemedir = async (r, nueva, usarActual) => {
    if (!evento) return;
    if (!usarActual) await guardarLectura(nueva).catch((e) => setMensaje(`Could not save the reading: ${e?.message || e}`));
    const mm = { ...(evento.respuestas?._m || {}) };
    if (clave === "spo2" && nueva?.spo2 != null && (CAMPOS_REMEDIR.spo2[0].campo in nueva)) mm.oximetro = nueva.spo2;
    mm.remediciones = [...(mm.remediciones || []), { t: new Date().toISOString(), resultado: r.resultado, lectura: r.lectura }].slice(-10);
    try {
      const remedirPasos = ev.planes.flatMap((p) => p.pasos).filter((p) => p.remedir && !hechos.has(p.id));
      if (r.resultado !== "peor") await Promise.all(remedirPasos.map((p) => marcarPaso(evento.id, p.id, { marcado_por: quien, nota: `remedir:${r.resultado}` })));
      if (r.resultado === "peor") {
        const nivel = subirNivel(mayorNivel(ev.nivel, mm.nivelMin || "ok"));
        mm.nivelMin = nivel;
        mm.peor = true;
        mm.avisos = [...(mm.avisos || []), { id: `peor.${Date.now()}`, t: new Date().toISOString(), nivel, sonar: true, texto: `${TITULOS[clave]}: worse on re-measurement. Goes up to ${ETIQUETA_NIVEL[nivel]}.` }].slice(-30);
        await actualizarEventoFicha(evento.id, { nivel, respuestas: toque({ ...(evento.respuestas || {}), _m: mm }) });
      } else if (r.resultado === "resuelto" && !(clave === "spo2" && ev.nivel === "critico" && nueva?.spo2 < 90)) {
        await actualizarEventoFicha(evento.id, { respuestas: toque({ ...(evento.respuestas || {}), _m: mm }) });
        cerradoAqui.current = true;
        await cerrarEventoFicha(evento.id, "resuelto");
      } else await actualizarEventoFicha(evento.id, { respuestas: toque({ ...(evento.respuestas || {}), _m: mm }) });
      await db.refresh();
    } catch (e) {
      setMensaje(`Could not save: ${e?.message || e}`);
    }
  };
  const cancelar = async () => {
    if (!evento) return;
    cerradoAqui.current = true;
    await cerrarEventoFicha(evento.id, "cancelado").catch(() => {});
    await db.refresh();
    cerrar();
  };

  const cargando = !ev;
  const nivel = ev ? mayorNivel(ev.nivel, m.nivelMin || "ok") : "moderado";
  const color = COLOR_NIVEL[nivel];
  const ultimoCerrado = !evento ? db.eventos.find((e) => e.clave === clave && e.cerrado_en && Date.now() - Date.parse(e.cerrado_en) < 10 * 6e4) : null;
  const pasosPlan = ev ? ev.planes.flatMap((p) => p.pasos.filter((x) => !x.abrir)) : [];
  const unicos = [...new Map(pasosPlan.map((p) => [p.id, p])).values()];
  const nHechos = unicos.filter((p) => hechos.has(p.id)).length;
  const completa = ev ? mostrarPruebaCompleta({ ev: { ...ev, nivel }, evento, notas }) : null;
  const deLaFicha = evento ? resultados.lista.filter((r) => r.desde_ficha === clave && r.hecho_en >= evento.abierto_en) : [];
  const fuentes = ev ? [...(ev.ficha.fuentes || []), ...(ev.ficha.contextoFuente ? ev.ficha.contextoFuente.split(",") : []), ...ev.causas.flatMap((c) => c.fuente.split(",")), ...ev.combinaciones.flatMap((c) => c.fuente.split(","))] : [];
  const sinEvento = !evento;
  const salvo = (x) => {
    const al = x.enVivo?.alarma_nave;
    const desde = al && typeof al === "object" ? al.desde : null;
    const t = x.enVivo?.a_salvo;
    return t && (!desde || t >= desde) ? t : null;
  };
  const peligrosVisibles = ev ? ev.ficha.peligro.filter((p) => !p.dato) : [];

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={`Card: ${TITULOS[clave]}`} data-ficha={clave}>
      <button type="button" aria-label="Close card" onClick={cerrar} className="ficha-fondo absolute inset-0 hidden bg-black/45 min-[1100px]:block" />
      <div ref={panel} className="ficha-panel ficha-cyber glass absolute inset-0 overflow-y-auto overscroll-contain rounded-none min-[1100px]:inset-y-3 min-[1100px]:left-auto min-[1100px]:right-3 min-[1100px]:w-[520px]"
        style={{ "--nivel": color }}>
        <header className="sticky top-0 z-10 flex items-start gap-3 border-b border-white/10 bg-[#17131a]/85 px-5 py-4 backdrop-blur-md">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{CATEGORIA_FICHA[clave]}</div>
            <h2 className="font-display text-xl font-semibold leading-tight">{ev?.titulo || TITULOS[clave]}</h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted">
              {ev && <Nivel nivel={nivel} grande />}
              {evento && <span>Opened {hora(evento.abierto_en)}</span>}
              {m.reusado && <span>· We used your recent answers</span>}
            </div>
          </div>
          <button type="button" onClick={cerrar} aria-label="Close" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-xl text-soft hover:bg-white/[0.12] hover:text-fg">×</button>
        </header>

        {cargando ? (
          <div className="px-5 py-10 text-center text-muted">Loading card…</div>
        ) : (
          <>
            {ultimoCerrado?.cierre === "resuelto" && (
              <div className="mx-5 mt-4 rounded-2xl border border-ok/50 bg-ok/10 px-4 py-3 text-sm font-semibold text-ok" data-resuelto>✓ Resolved at {hora(ultimoCerrado.cerrado_en)}</div>
            )}

            {ev.combinaciones.length > 0 && (
              <div className="mx-5 mt-4 rounded-2xl border border-white/12 bg-white/[0.05] px-4 py-3" data-combinaciones>
                <div className="mb-1.5 text-xs font-semibold text-soft">Combines with:</div>
                <ul className="space-y-2">
                  {ev.combinaciones.map((c) => (
                    <li key={c.id} className="text-sm" data-combinacion={c.id}>
                      <div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{c.titulo}</span><Nivel nivel={c.nivel} etiqueta={c.nivel === "info" ? "Notice" : null} />{c.todos && <span className="text-[11px] text-muted">Whole crew</span>}</div>
                      <p className="mt-0.5 text-xs text-muted">{c.significado}</p>
                      <Fuentes ids={c.fuente.split(",")} />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {ev.peligros.length > 0 ? (
              <div className="ficha-peligro mx-5 mt-4 rounded-2xl border border-crit/70 bg-crit/15 px-4 py-3" role="alert" data-peligro>
                <div className="mb-1 text-sm font-bold uppercase tracking-wide text-crit">Danger sign</div>
                <ul className="space-y-1 text-sm">
                  {ev.peligros.map((p) => <li key={p.id}>• {p.texto}</li>)}
                </ul>
                {respuestas._peligro && <button type="button" onClick={quitarPeligro} className="mt-2 text-xs text-muted underline">I made a mistake</button>}
              </div>
            ) : (
              ev.modo === "normal" && peligrosVisibles.length > 0 && (
                <div className={`mx-5 mt-4 rounded-2xl border px-4 py-3 ${m.peor ? "border-crit/60 bg-crit/10" : "border-white/10 bg-white/[0.03]"}`} data-senales>
                  <div className={`mb-1.5 text-xs font-semibold ${m.peor ? "text-crit" : "text-soft"}`}>{m.peor ? "You feel worse: do you have any of these signs?" : "Danger signs"}</div>
                  <ul className="space-y-1.5">
                    {peligrosVisibles.map((p) => (
                      <li key={p.id} className="flex items-center gap-2 text-sm">
                        <span className="min-w-0 flex-1 text-soft">{p.texto}</span>
                        <button type="button" onClick={() => marcarPeligro(p.id)} className="min-h-11 shrink-0 rounded-xl border border-crit/50 px-3 text-xs font-semibold text-crit hover:bg-crit/10">I have this</button>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            )}

            {ev.modo === "conductual" ? (
              <Seccion titulo="Behavioral health">
                <p className="mb-4 font-display text-lg leading-snug">We will connect you now with the behavioral health team.</p>
                <ul className="space-y-2">
                  {ev.planes[0].pasos.map((p) => (
                    <Paso key={p.id} paso={p} hecho={hechos.has(p.id)} nota={notaDe(p.id)} alt={altDe(p.id)} limite={limiteDe(p)} ahora={ahora} onToggle={() => alternar(p)} onToggleAlt={() => alternarAlt(p)} onNoPuedo={(mo, ex) => noPuedo(p, mo, ex)} deshabilitado={sinEvento} />
                  ))}
                </ul>
              </Seccion>
            ) : (
              <>
                <Seccion titulo="What is happening">
                  <p className="text-[15px] leading-snug" data-frase>{ev.frase}</p>
                  {ev.causaProbable && <p className="mt-2 text-[15px] font-semibold text-accent" data-causa-probable>{ev.causaProbable}.</p>}
                  {ev.contexto && <p className="mt-2 text-xs leading-snug text-muted">{ev.contexto}</p>}
                  {ev.ficha.nota && <p className="mt-2 text-xs leading-snug text-warn">{ev.ficha.nota}</p>}
                  {ev.exclusion && (
                    <div className="mt-3 flex items-center gap-2 rounded-xl border border-warn/50 bg-warn/10 px-3 py-2 text-sm text-warn">
                      <span className="min-w-0 flex-1">{ev.exclusion.texto}</span>
                      {onAbrir && <button type="button" onClick={() => onAbrir(ev.exclusion.abrir)} className="min-h-11 shrink-0 rounded-xl border border-warn/60 px-3 text-xs font-semibold">Open {TITULOS[ev.exclusion.abrir]}</button>}
                    </div>
                  )}
                </Seccion>

                {deLaFicha.length > 0 && (
                  <Seccion titulo="Test result">
                    <ul className="space-y-2" data-resultados-ficha>
                      {deLaFicha.map((r) => (
                        <li key={r.id} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm" data-resultado-prueba={r.prueba_id}>
                          <div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{PRUEBAS_POR_ID[r.prueba_id]?.nombre || r.prueba_id}</span><Nivel nivel={r.nivel} /><span className="text-xs text-muted">{hora(r.hecho_en)}</span></div>
                          <p className="mt-0.5 text-soft">Test result: {r.valor?.resultado?.texto}</p>
                        </li>
                      ))}
                    </ul>
                  </Seccion>
                )}

                {completa?.mostrar && evento && ev.modo !== "conductual" && (
                  <div className="mx-5 my-4 rounded-2xl border border-cyan/50 bg-cyan/[0.07] px-4 py-3" data-prueba-completa>
                    <div className="text-sm font-semibold text-fg">Take the full test</div>
                    <p className="mt-0.5 text-xs text-muted">{completa.motivos.join(" · ")}</p>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {completa.pruebas.map((id) => PRUEBAS_POR_ID[id] && (
                        <CyberButton key={id} href={`/pruebas/${id}?desde=${clave}&a=${aid}`} tam="sm" texto={PRUEBAS_POR_ID[id].nombre} data-abrir-prueba={id}>{PRUEBAS_POR_ID[id].nombre}</CyberButton>
                      ))}
                    </div>
                  </div>
                )}

                {ev.modo === "alarma" && (
                  <Seccion titulo="Ship alarm">
                    <p className="mb-3 text-sm font-semibold text-crit">Follow the ship procedure. Confirm when you are safe.</p>
                    <ul className="mb-3 space-y-1.5">
                      {trip.map((x) => (
                        <li key={x.id} className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2 text-sm" data-a-salvo={x.id}>
                          <span>{x.nombre}</span>
                          {salvo(x) ? <span className="font-semibold text-ok">Safe · {hora(salvo(x))}</span> : <span className="text-muted">Not confirmed</span>}
                        </li>
                      ))}
                    </ul>
                    <CyberButton onClick={() => setEnVivo(aid, "a_salvo", new Date().toISOString()).catch(() => {})} texto="I am safe">I am safe</CyberButton>
                  </Seccion>
                )}

                {ev.modo !== "alarma" && m.huboAlarma && (
                  <Seccion titulo="Vital signs check by crew member">
                    <ul className="space-y-1.5">
                      {trip.map((x) => (
                        <li key={x.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm">
                          <span>{x.nombre}</span>
                          <span className="text-xs text-muted">HR {x.lectura.fc ?? "—"} · SpO₂ {x.lectura.spo2 ?? "—"} % · RR {x.lectura.frec_resp ?? "—"}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href={`/tripulacion?a=${aid}`} className="mt-2 inline-block text-xs font-semibold text-cyan hover:underline">Open Crew</Link>
                  </Seccion>
                )}

                {ev.preguntas.length > 0 && (
                  <Seccion titulo="Survey">
                    <Encuesta ev={ev} onResponder={responder} editando={editando} setEditando={setEditando} />
                  </Seccion>
                )}

                {ev.modo === "normal" && (
                  <Seccion titulo="Causes">
                    <Causas ev={ev} />
                  </Seccion>
                )}

                <Seccion titulo={ev.modo === "emergencia" ? "Emergency plan" : "Plan"} extra={unicos.length > 0 && <span className="text-xs text-muted" data-progreso-plan>{nHechos} of {unicos.length} steps</span>}>
                  {unicos.length > 0 && (
                    <span className="mb-3 block h-1.5 overflow-hidden rounded-full bg-white/10">
                      <span className="block h-full rounded-full bg-ok transition-[width] duration-300" style={{ width: `${(nHechos / unicos.length) * 100}%` }} />
                    </span>
                  )}
                  {ev.empate && ev.modo === "normal" && <p className="mb-2 text-xs text-muted">There is a tie: follow both plans; the cause that resolves on re-measurement wins.</p>}
                  {sinEvento && <p className="mb-2 text-xs text-muted">This metric is in range; the plan stays as a guide.</p>}
                  <div className="space-y-4">
                    {ev.planes.map((pl) => (
                      <div key={pl.causa.id}>
                        {ev.planes.length > 1 && <div className="mb-1.5 text-xs font-semibold text-soft">{pl.causa.nombre}</div>}
                        <ul className="space-y-2">
                          {pl.pasos.map((p) => (
                            <Paso key={p.id} paso={p} hecho={hechos.has(p.id)} nota={notaDe(p.id)} alt={altDe(p.id)} limite={limiteDe(p)} ahora={ahora}
                              onToggle={() => alternar(p)} onToggleAlt={() => alternarAlt(p)} onNoPuedo={(mo, ex) => noPuedo(p, mo, ex)} onAbrir={onAbrir} deshabilitado={sinEvento} />
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </Seccion>

                {ev.modo !== "emergencia" && (
                  <Seccion titulo="NASA medical kit">
                    {ev.botiquin.length === 0 && <p className="text-sm text-soft">{ev.ficha.sinPrimeraLinea || "No medication for this case."}</p>}
                    {ev.ficha.sinPrimeraLinea && ev.botiquin.length > 0 && <p className="mb-2 text-sm text-soft">{ev.ficha.sinPrimeraLinea}</p>}
                    <ul className="space-y-2">
                      {ev.botiquin.map((med) => {
                        const al = alergiaDe(med, data?.profile?.alergias);
                        const tomado = db.medicamentos.find((x) => x.nombre === med.nombre && Date.now() - Date.parse(x.tomado_en) < 24 * 36e5);
                        return (
                          <li key={med.nombre} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2" data-medicamento={med.nombre}>
                            <div className="flex items-start gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-semibold">{med.nombre}</div>
                                <div className="text-xs text-muted">{med.paquete} · {med.uso}</div>
                                <div className={`mt-0.5 text-xs ${med.libre ? "text-ok" : "text-soft"}`}>{med.libre ? "You can take it on your own" : ev.ficha.textoNoLibre || TEXTO_NO_LIBRE}</div>
                                {med.advertencia && <div className="mt-0.5 text-xs text-warn">{med.advertencia}</div>}
                                {al && <div className="mt-0.5 text-xs font-semibold text-crit">⚠ Recorded allergy: {al}</div>}
                                {tomado && <div className="mt-0.5 text-xs text-cyan">Taken at {hora(tomado.tomado_en)}</div>}
                              </div>
                              <button type="button" onClick={() => tome(med.nombre)} className="min-h-11 shrink-0 rounded-xl border border-white/15 px-3 text-xs font-semibold text-soft hover:bg-white/10">I took this medication</button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                    {(ev.ficha.avisosBotiquin || []).map((a) => <p key={a} className="mt-2 text-xs text-warn">{a}</p>)}
                    <p className="mt-2 text-xs text-muted">{NOTA_BOTIQUIN}</p>
                  </Seccion>
                )}

                {ev.modo !== "alarma" && (
                  <Seccion titulo="Measure again">
                    <Remedir key={`${clave}-${evento?.id || "x"}`} clave={clave} ev={ev} contexto={calc.contexto} inicial={m.lecturaInicial} onResultado={alRemedir} deshabilitado={sinEvento} />
                  </Seccion>
                )}
              </>
            )}

            <Seccion titulo="When to escalate">
              <ul className="space-y-1.5">
                {ev.ficha.escalar.map((e) => (
                  <li key={e.texto} className="flex items-start gap-2 text-sm"><Nivel nivel={e.nivel} etiqueta={e.nivel === "info" ? "Notice" : null} /><span className="min-w-0 flex-1 text-soft">{e.texto}</span></li>
                ))}
              </ul>
            </Seccion>

            <div className="border-t border-white/10 px-5 py-4">
              <Fuentes ids={fuentes} />
              {evento && (
                <button type="button" onClick={cancelar} className="mt-3 min-h-11 rounded-xl border border-white/12 px-3 text-xs font-semibold text-muted hover:text-soft" data-accion="cancelar-ficha">Close without resolving</button>
              )}
            </div>
          </>
        )}
        {mensaje && (
          <div role="status" className="sticky bottom-3 mx-5 mb-3 rounded-full border border-white/15 bg-[#17131a]/95 px-4 py-2 text-center text-xs font-semibold" onClick={() => setMensaje(null)}>{mensaje}</div>
        )}
      </div>
      <div aria-hidden className="ficha-cyber-marco absolute inset-0 min-[1100px]:inset-y-3 min-[1100px]:left-auto min-[1100px]:right-3 min-[1100px]:w-[520px]" style={{ "--nivel": color }}>
        <span className="cm-backdrop"><span className="cm-corner" /></span>
        <span className="ficha-cyber-barra" />
      </div>
    </div>
  );
}
