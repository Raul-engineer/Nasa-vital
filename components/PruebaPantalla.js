"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import CyberButton from "./CyberButton";
import { Icon } from "./Icons";
import { CheckinForm, PvtbTest, RemedicionTest } from "./Pruebas";
import { guardarResultado, saveCheckin, savePrueba, setEnVivo, setEnVivoVarios } from "@/lib/data";
import { evaluarPrueba } from "@/lib/analysis";
import { COLOR_NIVEL, ETIQUETA_NIVEL } from "@/lib/fichas";
import { baseDe, calificarPrueba, CATEGORIAS_PRUEBA, comparar, pasosVisibles, PRUEBAS_POR_ID, ZONAS_DOLOR } from "@/lib/pruebas";
import { LIMITES, validarCampo, validarLectura } from "@/lib/validar";
import { partesFuente } from "@/lib/fuentes";
import { useHistorialPruebas } from "@/lib/useFichas";
import { useQuickFix } from "@/lib/useQuickFix";

const SIGUIENTES = {
  critico: "Avisa ahora al oficial médico. No te quedes solo.",
  urgente: "Abre tu ficha y avisa al oficial médico.",
  moderado: "Sigue el plan de tu ficha y repite la prueba como toca.",
  info: "Tómalo en cuenta al planear tus tareas de hoy.",
  ok: "Sin cambios: sigue tu rutina.",
};
const BTN = "min-h-14 rounded-2xl border px-4 text-lg font-semibold transition active:scale-[0.98] disabled:opacity-40";
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;

function Temporizador({ segundos, onFin }) {
  const [resta, setResta] = useState(segundos);
  const [corre, setCorre] = useState(false);
  useEffect(() => {
    if (!corre) return;
    if (resta <= 0) {
      setCorre(false);
      onFin?.();
      return;
    }
    const t = setTimeout(() => setResta((x) => x - 1), 1000);
    return () => clearTimeout(t);
  }, [corre, resta]);
  return (
    <div className="flex flex-col items-center gap-4" data-temporizador>
      <div className={`font-display text-7xl font-semibold tabular-nums ${resta <= 0 ? "text-ok" : ""}`} aria-live="polite">{fmt(resta)}</div>
      <div className="h-2 w-full max-w-md overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-cyan transition-[width] duration-1000" style={{ width: `${(1 - resta / segundos) * 100}%` }} /></div>
      {resta > 0 && <button type="button" onClick={() => setCorre((x) => !x)} className={`${BTN} border-cyan/60 bg-cyan/15 text-fg`}>{corre ? "Pausar" : resta === segundos ? "Iniciar" : "Seguir"}</button>}
    </div>
  );
}

function Amsler({ valor, onChange }) {
  const [ojo, setOjo] = useState("od");
  const v = valor || { od: [], oi: [] };
  const marcar = (c) => onChange({ ...v, [ojo]: v[ojo].includes(c) ? v[ojo].filter((x) => x !== c) : [...v[ojo], c] });
  return (
    <div className="flex flex-col items-center gap-4" data-amsler>
      <div className="flex gap-2">
        {[["od", "Ojo derecho"], ["oi", "Ojo izquierdo"]].map(([k, t]) => (
          <button key={k} type="button" onClick={() => setOjo(k)} className={`${BTN} ${ojo === k ? "border-cyan bg-cyan/20 text-fg" : "border-white/15 text-soft"}`}>{t}{v[k].length ? ` · ${v[k].length}` : ""}</button>
        ))}
      </div>
      <p className="text-center text-base text-soft">Tapa el otro ojo y mira el punto central a 30–40 cm. Toca los cuadros donde las líneas se ven onduladas o faltan.</p>
      <div className="grid w-full max-w-[360px] grid-cols-10 overflow-hidden rounded-xl bg-white p-0" role="grid" aria-label={`Rejilla de Amsler, ${ojo === "od" ? "ojo derecho" : "ojo izquierdo"}`}>
        {Array.from({ length: 100 }, (_, i) => {
          const c = `${Math.floor(i / 10)}-${i % 10}`;
          const on = v[ojo].includes(c);
          return (
            <button key={c} type="button" onClick={() => marcar(c)} aria-pressed={on} aria-label={`Fila ${Math.floor(i / 10) + 1}, columna ${(i % 10) + 1}`} data-celda={c}
              className="relative aspect-square border-[0.5px] border-[#111]" style={{ background: on ? "rgba(255,114,120,0.55)" : "#fff" }}>
              {(i === 44 || i === 45 || i === 54 || i === 55) && <span className={`absolute h-2 w-2 rounded-full bg-[#111] ${i === 44 ? "bottom-[-4px] right-[-4px]" : i === 45 ? "bottom-[-4px] left-[-4px]" : i === 54 ? "right-[-4px] top-[-4px]" : "left-[-4px] top-[-4px]"}`} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const LETRAS = "EFPTOZLDCNHRKSV";
function Agudeza({ valor, onChange }) {
  const v = valor || { distancia: 1, od: null, oi: null, cerca: null };
  const [fase, setFase] = useState("od");
  const filas = Array.from({ length: 10 }, (_, i) => 1.0 - i * 0.1);
  const dist = fase === "cerca" ? 400 : v.distancia * 1000;
  const px = (logmar) => Math.max(7, Math.round(dist * 0.001454 * 10 ** logmar * 3.78));
  const letras = (i) => Array.from({ length: Math.min(5, 2 + Math.floor(i / 2)) }, (_, j) => LETRAS[(i * 3 + j * 7) % LETRAS.length]).join(" ");
  const nombres = { od: "Ojo derecho de lejos", oi: "Ojo izquierdo de lejos", cerca: "Los dos ojos de cerca (40 cm)" };
  return (
    <div className="flex flex-col items-center gap-4" data-agudeza>
      <div className="flex flex-wrap justify-center gap-2">
        {[1, 2, 3].map((d) => <button key={d} type="button" onClick={() => onChange({ ...v, distancia: d })} className={`${BTN} ${v.distancia === d ? "border-cyan bg-cyan/20 text-fg" : "border-white/15 text-soft"}`}>{d} m</button>)}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {Object.entries(nombres).map(([k, t]) => <button key={k} type="button" onClick={() => setFase(k)} className={`${BTN} text-base ${fase === k ? "border-cyan bg-cyan/20 text-fg" : "border-white/15 text-soft"}`}>{t}{v[k] != null ? ` · ${v[k]}` : ""}</button>)}
      </div>
      <p className="text-center text-base text-soft">{fase === "cerca" ? "Sostén la pantalla a 40 cm." : `Colócate a ${v.distancia} m de la pantalla y tapa el otro ojo.`} Toca la fila más chica que puedas leer completa.</p>
      <div className="w-full max-w-xl space-y-1 rounded-2xl bg-white px-3 py-4 text-center text-[#111]">
        {filas.map((lm, i) => (
          <button key={i} type="button" onClick={() => onChange({ ...v, [fase]: i + 1 })} data-fila={i + 1}
            className={`block w-full rounded-lg py-1 font-mono font-bold leading-none tracking-[0.3em] ${v[fase] === i + 1 ? "bg-[#a8fff0]" : "hover:bg-black/5"}`} style={{ fontSize: px(lm) }}>
            {letras(i)}
          </button>
        ))}
      </div>
    </div>
  );
}

function MapaDolor({ valor, onChange }) {
  const v = Array.isArray(valor) ? valor : [];
  return (
    <div className="grid w-full max-w-xl grid-cols-2 gap-2" data-mapa-dolor>
      {ZONAS_DOLOR.map(([k, t]) => {
        const on = v.includes(k);
        return <button key={k} type="button" aria-pressed={on} onClick={() => onChange(on ? v.filter((x) => x !== k) : [...v, k])} className={`${BTN} ${on ? (k === "pecho" ? "border-crit bg-crit/20 text-fg" : "border-cyan bg-cyan/20 text-fg") : "border-white/15 text-soft"}`}>{t}</button>;
      })}
    </div>
  );
}

function CabinaTripulacion({ valor, onChange, tripulacion = [], cabina = {} }) {
  const v = valor || {};
  const set = (id, k) => onChange({ ...v, [id]: { ...(v[id] || {}), [k]: !v[id]?.[k] } });
  return (
    <div className="w-full max-w-2xl space-y-3" data-cabina-tripulacion>
      <div className="rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-base text-soft">CO₂ {cabina.co2_ppm != null ? Number(cabina.co2_ppm).toLocaleString("es-MX") : "—"} ppm · {cabina.temp_c ?? "—"} °C · {cabina.humedad ?? "—"} % de humedad</div>
      {tripulacion.map((a) => (
        <div key={a.id} className="rounded-2xl border border-white/12 px-4 py-3">
          <div className="mb-2 text-lg font-semibold">{a.nombre}</div>
          <div className="grid grid-cols-3 gap-2">
            {[["dolor", "Dolor de cabeza"], ["cansancio", "Cansancio"], ["sueno", "Mal sueño"]].map(([k, t]) => (
              <button key={k} type="button" aria-pressed={!!v[a.id]?.[k]} onClick={() => set(a.id, k)} className={`${BTN} text-sm ${v[a.id]?.[k] ? "border-warn bg-warn/20 text-fg" : "border-white/15 text-soft"}`}>{t}</button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function errorDePaso(paso, r) {
  if (paso.tipo === "numero") {
    if (r[paso.id] == null || r[paso.id] === "") return paso.obligatorio ? "Falta este dato." : null;
    const v = validarLectura({ [paso.campo]: r[paso.id] });
    if (LIMITES[paso.campo] && !v.ok) return v.errores[0].texto;
    return validarCampo(paso.campo, r[paso.id], { obligatorio: paso.obligatorio });
  }
  if (paso.tipo === "lectura") {
    const val = r[paso.id] || {};
    for (const c of paso.campos) {
      const e = validarCampo(c.rango, val[c.id]);
      if (e) return `${c.etiqueta}: ${e}`;
    }
    const v = validarLectura(val);
    return v.ok ? null : v.errores[0].texto;
  }
  if (paso.tipo === "escala") return validarCampo(paso.campo || "dolor", r[paso.id]) ? "Elige una opción." : null;
  if (["opciones", "sino", "hora"].includes(paso.tipo)) return r[paso.id] == null || r[paso.id] === "" ? "Elige una opción." : null;
  if (paso.tipo === "especial" && paso.componente === "agudeza") return r.agudeza?.od == null || r.agudeza?.oi == null || r.agudeza?.cerca == null ? "Marca los tres: ojo derecho, izquierdo y cerca." : null;
  return null;
}

export default function PruebaPantalla({ id, astronautId, desde = null }) {
  const prueba = PRUEBAS_POR_ID[id];
  const { data, analisis } = useQuickFix(astronautId);
  const { historial } = useHistorialPruebas(data?.astronaut?.id, data);
  const [fase, setFase] = useState("intro");
  const [i, setI] = useState(0);
  const [r, setR] = useState({});
  const [salir, setSalir] = useState(false);
  const [guardado, setGuardado] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const principal = useRef(null);

  const base = useMemo(() => {
    if (!data || !analisis) return {};
    const porK = Object.fromEntries(analisis.tarjetas.map((t) => [t.k, t]));
    const previos = historial.filter((x) => !guardado || x.id !== guardado.id);
    return baseDe(id, previos, {
      tareaCritica: !!data.enVivo?.tarea_critica, sistolica: analisis.hoy?.sistolica, news2: analisis.news2?.total, confusion: !!analisis.checkinHoy?.confusion,
      rangoTemp: porK.temp?.rangoPersonal, ejercicioMeta: Number(data.profile?.ejercicio_prescrito_min) || 120,
    });
  }, [data, analisis, historial, id, guardado]);

  useEffect(() => {
    principal.current?.focus?.();
  }, [i, fase]);

  if (!prueba) return <div className="grid min-h-screen place-items-center p-8 text-center text-muted">No encontramos esa prueba. <Link href="/pruebas" className="ml-1 text-cyan underline">Volver a Pruebas</Link></div>;
  if (!data || !analisis) return <div className="grid min-h-screen place-items-center text-muted">Cargando prueba…</div>;

  const aid = data.astronaut.id;
  const pasos = pasosVisibles(prueba, r);
  const paso = pasos[Math.min(i, pasos.length - 1)];
  const set = (k, v) => setR((x) => ({ ...x, [k]: v }));
  const volverA = desde ? `/?a=${aid}&ficha=${desde}` : `/pruebas?a=${aid}`;
  const res = fase === "resultado" ? calificarPrueba(id, r, base) : null;

  const siguiente = () => {
    const e = errorDePaso(paso, r);
    if (e) {
      setError(e);
      return;
    }
    setError(null);
    const vis = pasosVisibles(prueba, r);
    if (i + 1 >= vis.length) setFase("resultado");
    else setI(i + 1);
  };
  const terminarEspecial = (k, v) => {
    const nuevo = { ...r, [k]: v };
    setR(nuevo);
    setError(null);
    const vis = pasosVisibles(prueba, nuevo);
    if (i + 1 >= vis.length) setFase("resultado");
    else setI(i + 1);
  };
  const atras = () => {
    setError(null);
    if (i > 0) setI(i - 1);
    else setFase("intro");
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      const { causas, ...resultado } = res;
      const fila = await guardarResultado({ astronaut_id: aid, prueba_id: id, valor: { respuestas: r, resultado, causas: causas || {} }, nivel: res.nivel, desde_ficha: desde });
      const leg = prueba.legado;
      if (leg === "who5" || leg === "phq9" || leg === "gad7") {
        const resp = Array.from({ length: { who5: 5, phq9: 9, gad7: 7 }[leg] }, (_, k) => Number(r[`i${k + 1}`] || 0));
        const suma = resp.reduce((a, b) => a + b, 0);
        const rr = leg === "who5" ? { respuestas: resp, bruto: suma, puntaje: suma * 4, rp: fila.id } : { respuestas: resp, puntaje: suma, item9: leg === "phq9" ? resp[8] : undefined, rp: fila.id };
        await savePrueba({ astronaut_id: aid, tipo: leg, resultado: rr, interpretacion: res.texto });
      } else if (leg === "reaccion") {
        await savePrueba({ astronaut_id: aid, tipo: "reaccion", resultado: { ...r.pvt, rp: fila.id }, interpretacion: res.texto, desenlace: evaluarPrueba("reaccion", r.pvt, analisis).desenlace });
        if (r.pvt?.mediana_ms) await saveCheckin({ astronaut_id: aid, tiempo_reaccion_ms: r.pvt.mediana_ms });
      } else if (leg === "amsler") {
        await savePrueba({ astronaut_id: aid, tipo: "amsler", resultado: { od: !!r.amsler?.od?.length, oi: !!r.amsler?.oi?.length, celdas: r.amsler, rp: fila.id }, interpretacion: res.texto });
      } else if (leg === "ortostatica") {
        const rr = { acostado: r.acostado, min1: r.min1, min3: r.min3, rp: fila.id };
        await savePrueba({ astronaut_id: aid, tipo: "ortostatica", resultado: rr, interpretacion: res.texto, desenlace: evaluarPrueba("ortostatica", rr, analisis).desenlace });
      } else if (leg === "remedicion") {
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
      setGuardado(fila);
    } catch (e) {
      setError(`No se pudo guardar: ${e?.message || e}`);
    }
    setGuardando(false);
  };

  const cabinaHoy = analisis.tarjetas.find((t) => t.k === "cabina")?.cabinaHoy || {};
  const pct = fase === "intro" ? 0 : fase === "resultado" ? 100 : Math.round((i / Math.max(1, pasos.length)) * 100);
  const color = res ? COLOR_NIVEL[res.nivel] : null;

  return (
    <div className="fixed inset-0 z-40 flex flex-col overflow-y-auto bg-[#100f13]" data-prueba-pantalla={id}>
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#17131a]/95 px-4 py-3 backdrop-blur-md sm:px-8">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent"><Icon name={prueba.icono} size={24} /></span>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{CATEGORIAS_PRUEBA[prueba.categoria].nombre} · {prueba.duracion}</div>
            <h1 className="truncate font-display text-xl font-semibold">{prueba.nombre}</h1>
          </div>
          <button type="button" onClick={() => (fase === "intro" || guardado ? (window.location.href = volverA) : setSalir(true))} className="min-h-12 shrink-0 rounded-xl border border-white/15 px-4 text-base font-semibold text-soft hover:bg-white/10" data-accion="salir-prueba">Salir</button>
        </div>
        <div className="mx-auto mt-3 h-2 max-w-4xl overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-cyan transition-[width] duration-300" style={{ width: `${pct}%` }} /></div>
        {prueba.companero && <div className="mx-auto mt-2 max-w-4xl text-sm font-semibold text-warn" data-companero>Hazla con un compañero</div>}
      </header>

      <main ref={principal} tabIndex={-1} className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-6 px-4 py-8 outline-none sm:px-8">
        {fase === "intro" && (
          <div className="flex w-full max-w-2xl flex-col items-center gap-5 text-center">
            <p className="font-display text-3xl font-semibold leading-tight">{prueba.resumen}</p>
            <p className="text-lg text-soft">{prueba.paraQue}</p>
            {desde && <p className="text-base text-cyan">La pidió tu ficha. El resultado regresa a la ficha.</p>}
            <p className="text-sm text-muted">{comparar(id, base.mediana, base) === "Primera vez: esta será tu base." ? "Primera vez: esta será tu base." : `Última vez: ${base.ultimo ? new Date(base.ultimo.hecho_en).toLocaleDateString("es-MX", { day: "numeric", month: "short" }) : "—"} · ${ETIQUETA_NIVEL[base.ultimo?.nivel] || "—"}`}</p>
            <button type="button" onClick={() => { setFase("pasos"); setI(0); }} className={`${BTN} w-full max-w-sm border-cyan bg-cyan/20 text-fg`} data-accion="comenzar">Comenzar</button>
          </div>
        )}

        {fase === "pasos" && paso && (
          <div className="flex w-full flex-col items-center gap-6" data-paso-prueba={paso.id}>
            <div className="text-sm text-muted">Paso {Math.min(i + 1, pasos.length)} de {pasos.length}</div>
            {paso.intro && <p className="text-center text-base text-muted">{paso.intro}</p>}
            {paso.texto && <p className="max-w-3xl text-center font-display text-3xl font-semibold leading-tight">{paso.texto}</p>}

            {paso.tipo === "info" && paso.segundos && <Temporizador key={paso.id} segundos={paso.segundos} />}
            {paso.tipo === "numero" && (
              <label className="flex items-baseline gap-3">
                <input type="number" inputMode="decimal" step={paso.paso || 1} autoFocus value={r[paso.id] ?? ""} onChange={(e) => set(paso.id, e.target.value === "" ? "" : Number(e.target.value))}
                  onKeyDown={(e) => e.key === "Enter" && siguiente()} className="campo w-48 text-center font-display text-5xl font-semibold" aria-label={paso.texto} data-campo={paso.id} />
                <span className="text-xl text-muted">{paso.unidad}</span>
              </label>
            )}
            {paso.tipo === "lectura" && (
              <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-3">
                {paso.campos.map((c, k) => (
                  <label key={c.id} className="flex flex-col gap-1 text-base text-muted">
                    {c.etiqueta} ({c.unidad})
                    <input type="number" inputMode="decimal" autoFocus={k === 0} value={r[paso.id]?.[c.id] ?? ""} onChange={(e) => set(paso.id, { ...(r[paso.id] || {}), [c.id]: e.target.value === "" ? "" : Number(e.target.value) })}
                      className="campo min-h-14 text-center font-display text-3xl font-semibold text-fg" data-campo={`${paso.id}.${c.id}`} />
                  </label>
                ))}
              </div>
            )}
            {paso.tipo === "escala" && (
              <div className="w-full max-w-3xl">
                <div className={`grid gap-2 ${paso.max - paso.min + 1 > 6 ? "grid-cols-4 sm:grid-cols-6" : "grid-cols-5"}`} style={{ gridTemplateColumns: paso.max - paso.min + 1 <= 11 ? `repeat(${Math.min(paso.max - paso.min + 1, 6)}, minmax(0, 1fr))` : undefined }}>
                  {Array.from({ length: paso.max - paso.min + 1 }, (_, k) => paso.min + k).map((v) => (
                    <button key={v} type="button" onClick={() => set(paso.id, v)} aria-pressed={r[paso.id] === v} data-valor={v}
                      className={`${BTN} min-h-16 ${r[paso.id] === v ? "border-cyan ring-2 ring-cyan" : "border-white/15"}`} style={paso.colores ? { background: paso.colores[v - 1], color: "#111" } : r[paso.id] === v ? { background: "rgba(168,255,240,0.2)" } : undefined}>
                      {v}
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-sm text-muted">{Object.entries(paso.etiquetas || {}).map(([k, t]) => <span key={k}>{k} · {t}</span>)}</div>
              </div>
            )}
            {(paso.tipo === "opciones" || paso.tipo === "sino") && (
              <div className="grid w-full max-w-2xl gap-2">
                {(paso.tipo === "sino" ? [["si", "Sí"], ["no", "No"]] : paso.opciones).map(([v, t]) => (
                  <button key={String(v)} type="button" onClick={() => set(paso.id, v)} aria-pressed={r[paso.id] === v} data-opcion={String(v)}
                    className={`${BTN} text-left ${r[paso.id] === v ? "border-cyan bg-cyan/20 text-fg" : "border-white/15 text-soft hover:bg-white/[0.06]"}`}>{t}</button>
                ))}
              </div>
            )}
            {paso.tipo === "multi" && (
              <div className="grid w-full max-w-2xl grid-cols-3 gap-2">
                {paso.opciones.map(([v, t]) => {
                  const lista = Array.isArray(r[paso.id]) ? r[paso.id] : [];
                  const on = lista.includes(v);
                  return <button key={v} type="button" aria-pressed={on} onClick={() => set(paso.id, on ? lista.filter((x) => x !== v) : [...lista, v])} className={`${BTN} ${on ? "border-warn bg-warn/20 text-fg" : "border-white/15 text-soft"}`}>{t}</button>;
                })}
              </div>
            )}
            {paso.tipo === "hora" && <input type="time" value={r[paso.id] ?? ""} onChange={(e) => set(paso.id, e.target.value)} className="campo min-h-14 text-center font-display text-4xl" aria-label={paso.texto} data-campo={paso.id} />}

            {paso.tipo === "especial" && paso.componente === "checkin" && (
              <div className="w-full max-w-2xl"><CheckinForm astronautId={aid} inicial={analisis.checkinHoy} who5Pendiente={analisis.tamizaje?.who5Pendiente} onResultado={(ev) => terminarEspecial("checkin", ev.valores || {})} /></div>
            )}
            {paso.tipo === "especial" && paso.componente === "remedicion" && <div className="w-full max-w-2xl"><RemedicionTest hoy={analisis.hoy} onFinish={(x) => terminarEspecial("remedicion", x)} /></div>}
            {paso.tipo === "especial" && paso.componente === "pvt" && <div className="w-full max-w-2xl"><PvtbTest base={base.mediana || analisis.baselines?.reaccion?.media} onFinish={(x) => terminarEspecial("pvt", x)} /></div>}
            {paso.tipo === "especial" && paso.componente === "amsler" && <Amsler valor={r.amsler} onChange={(v) => set("amsler", v)} />}
            {paso.tipo === "especial" && paso.componente === "agudeza" && <Agudeza valor={r.agudeza} onChange={(v) => set("agudeza", v)} />}
            {paso.tipo === "especial" && paso.componente === "mapaDolor" && <><p className="text-center font-display text-3xl font-semibold">¿Dónde te duele?</p><MapaDolor valor={r.zonas} onChange={(v) => set("zonas", v)} /></>}
            {paso.tipo === "especial" && paso.componente === "cabinaTripulacion" && <CabinaTripulacion valor={r.tripulacion} onChange={(v) => set("tripulacion", v)} tripulacion={data.astronauts} cabina={cabinaHoy} />}

            {error && <p className="text-center text-lg font-semibold text-warn" role="alert" data-error-prueba>{error}</p>}

            {!(paso.tipo === "especial" && ["checkin", "remedicion", "pvt"].includes(paso.componente)) && (
              <div className="flex w-full max-w-2xl gap-3">
                <button type="button" onClick={atras} className={`${BTN} flex-1 border-white/15 text-soft`}>Atrás</button>
                <button type="button" onClick={siguiente} className={`${BTN} flex-[2] border-cyan bg-cyan/20 text-fg`} data-accion="siguiente">{i + 1 >= pasos.length ? "Ver resultado" : "Siguiente"}</button>
              </div>
            )}
          </div>
        )}

        {fase === "resultado" && res && (
          <div className="flex w-full max-w-2xl flex-col items-center gap-4 text-center" data-resultado={res.nivel}>
            <div className="font-display text-7xl font-semibold leading-none" style={{ color }}>{res.valor ?? "—"}<span className="ml-2 text-2xl text-muted">{prueba.compara?.unidad || ""}</span></div>
            <span className="rounded-full border px-4 py-1.5 text-lg font-semibold" style={{ color, borderColor: color, background: `color-mix(in oklab, ${color} 14%, transparent)` }}>{ETIQUETA_NIVEL[res.nivel]}</span>
            <p className="font-display text-2xl leading-snug">{res.texto}</p>
            <p className="text-base text-soft" data-comparacion>{comparar(id, res.valor, base)}</p>
            <p className="text-base text-muted">{SIGUIENTES[res.nivel]}</p>
            {res.detalles?.peligro && <p className="text-base font-semibold text-crit">Revisa las señales de peligro de tu ficha.</p>}
            <p className="text-xs text-muted">Basado en: {partesFuente(prueba.fuente).map((p) => p.texto).join(" · ")}</p>
            {error && <p className="text-lg font-semibold text-warn">{error}</p>}
            {!guardado ? (
              <div className="flex w-full gap-3">
                <button type="button" onClick={() => { setFase("pasos"); setI(Math.max(0, pasos.length - 1)); }} className={`${BTN} flex-1 border-white/15 text-soft`}>Atrás</button>
                <button type="button" disabled={guardando} onClick={guardar} className={`${BTN} flex-[2] border-cyan bg-cyan/20 text-fg`} data-accion="guardar-prueba">{guardando ? "Guardando…" : "Guardar"}</button>
              </div>
            ) : (
              <div className="flex w-full flex-col gap-3" data-guardado>
                <p className="text-lg font-semibold text-ok">✓ Guardado</p>
                {desde ? <CyberButton href={volverA} texto="Volver a la ficha" data-accion="volver-ficha">Volver a la ficha</CyberButton> : <CyberButton href={volverA} texto="Volver a Pruebas">Volver a Pruebas</CyberButton>}
              </div>
            )}
          </div>
        )}
      </main>

      {salir && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Salir de la prueba">
          <div className="glass w-full max-w-md p-6 text-center">
            <p className="font-display text-2xl font-semibold">¿Salir de la prueba?</p>
            <p className="mt-2 text-base text-soft">No se guardan las respuestas.</p>
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => setSalir(false)} className={`${BTN} flex-1 border-white/15 text-soft`}>Seguir</button>
              <a href={volverA} className={`${BTN} flex flex-1 items-center justify-center border-crit/60 bg-crit/15 text-fg`} data-accion="confirmar-salir">Salir</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
