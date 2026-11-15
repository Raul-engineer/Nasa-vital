"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ESTADO, iniciales } from "@/components/Shell";
import { NOMBRE_SINTOMA } from "@/lib/analysis";
import { borrarEnVivo, CLAVES_TRIPULACION, confirmarRefugio, iniciarTormenta, resetEnVivo, setActividad, setEnVivo, setEnVivoTripulacion, setEnVivoVarios, terminarTormenta } from "@/lib/data";
import { useAstronautId, useConexion, useQuickFix } from "@/lib/useQuickFix";
import { useFichas } from "@/lib/useFichas";
import { COLOR_NIVEL, ETIQUETA_NIVEL, pasosDeEvento, TITULOS } from "@/lib/fichas";
import { pasosHechos } from "@/lib/escalamiento";
import Ficha from "@/components/Ficha";
import VigiaFichas from "@/components/VigiaFichas";

const GRUPOS = [
  ["Signos vitales", [
    { c: "fc", n: "Frecuencia cardiaca", u: "lpm", paso: 5, min: 30, max: 200, v: "fc" },
    { c: "sistolica", n: "Presión sistólica", u: "mmHg", paso: 5, min: 70, max: 220, v: "pa" },
    { c: "diastolica", n: "Presión diastólica", u: "mmHg", paso: 5, min: 40, max: 130, v: "pa" },
    { c: "frec_resp", n: "Frecuencia respiratoria", u: "rpm", paso: 1, min: 6, max: 40, v: "fr" },
    { c: "spo2", n: "SpO₂", u: "%", paso: 1, min: 80, max: 100, v: "spo2" },
    { c: "temperatura", n: "Temperatura", u: "°C", paso: 0.1, min: 34, max: 41.5, v: "temp", dec: 1 },
  ]],
  ["Salud en el espacio", [
    { c: "tasa_radiacion", n: "Radiación (tasa)", u: "µSv/h", paso: 5, min: 0, max: 1000, v: "radiacion" },
    { c: "co2_ppm", n: "CO₂ de la cabina · toda la tripulación", u: "ppm", paso: 250, min: 400, max: 8000, v: "cabina" },
    { c: "temp_cabina", n: "Temperatura de la cabina", u: "°C", paso: 0.5, min: 10, max: 35, v: "cabina", dec: 1 },
    { c: "humedad_cabina", n: "Humedad de la cabina", u: "%", paso: 5, min: 5, max: 95, v: "cabina" },
    { c: "ejercicio_pct", n: "Ejercicio", u: "%", paso: 10, min: 0, max: 200, v: "huesos" },
  ]],
  ["Mente y sueño", [
    { c: "horas_sueno", n: "Sueño", u: "h", paso: 0.5, min: 0, max: 12, v: "sueno", dec: 1 },
    { c: "who5", n: "WHO-5", u: "/100", paso: 4, min: 0, max: 100, v: "animo" },
    { c: "estres", n: "Estrés", u: "/5", paso: 1, min: 1, max: 5, v: "animo" },
    { c: "tripulacion", n: "Tripulación", u: "/5", paso: 1, min: 1, max: 5, v: "animo" },
  ]],
];

const SINTOMAS = ["garganta", "llagas", "ronchas", "estomago"];
const FASES = [["orbita", "Órbita"], ["luna", "Luna"], ["marte", "Marte"], ["regreso", "Regreso"]];
const hora = (iso) => (iso ? new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }) : "—");

function FichasAbiertas({ fichas, onAbrir }) {
  const abiertos = fichas.eventos.filter((e) => !e.cerrado_en);
  if (!abiertos.length) return <p className="px-1 text-sm text-muted">Sin fichas abiertas.</p>;
  return (
    <ul className="grid gap-2">
      {abiertos.map((e) => {
        const pasos = pasosDeEvento(e);
        const hechos = pasosHechos(fichas.pasos, e.id);
        const n = pasos.filter((p) => hechos.has(p.id)).length;
        const c = COLOR_NIVEL[e.nivel] || COLOR_NIVEL.moderado;
        return (
          <li key={e.id}>
            <button onClick={() => onAbrir(e.clave)} data-ficha-abierta={e.clave}
              className="glass flex min-h-12 w-full items-center gap-3 px-4 py-3 text-left" style={{ borderColor: `color-mix(in oklab, ${c} 55%, transparent)` }}>
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: c }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{TITULOS[e.clave] || e.clave}</span>
                <span className="block text-xs text-muted">{ETIQUETA_NIVEL[e.nivel]} · {n} de {pasos.length} pasos · desde {hora(e.abierto_en)}</span>
              </span>
              <span className="text-sm font-semibold text-cyan">Abrir</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
const ESCENARIOS = ["Normal", "Esfuerzo", "Fiebre", "Fatiga", "Oxígeno bajo", "Presión baja", "Tormenta solar", "CO₂ alto"];
const DEBOUNCE_MS = 250;

function valoresActuales(data, analisis) {
  const r = analisis.hoyReposo || analisis.hoy;
  const v = data.vitals.at(-1) || {};
  const ci = data.checkins.find((c) => c.fecha === analisis.fecha) || {};
  const porK = Object.fromEntries(analisis.tarjetas.map((t) => [t.k, t]));
  return {
    fc: r.fc, sistolica: r.sistolica, diastolica: r.diastolica, frec_resp: r.frec_resp, spo2: r.spo2, temperatura: r.temperatura,
    tasa_radiacion: Math.round(((Number(v.dosis_dia_msv) || 0) * 1000) / 24), co2_ppm: porK.cabina?.valor, ejercicio_pct: porK.huesos?.valor,
    temp_cabina: porK.cabina?.cabinaHoy?.temp_c, humedad_cabina: porK.cabina?.cabinaHoy?.humedad,
    horas_sueno: v.horas_sueno, who5: porK.animo?.valor, estres: ci.estres, tripulacion: ci.tripulacion,
    pulso_irregular: !!data.enVivo?.pulso_irregular, tarea_critica: !!data.enVivo?.tarea_critica, alarma_nave: data.enVivo?.alarma_nave || null, fase_mision: data.enVivo?.fase_mision || "orbita",
    confusion: !!ci.confusion, mareo_de_pie: !!ci.mareo_de_pie, vision_borrosa: !!ci.vision_borrosa, dolor_cabeza: !!ci.dolor_cabeza,
    sintomas: Array.isArray(ci.sintomas) ? ci.sintomas : [],
  };
}

function Indicador() {
  const c = useConexion();
  const [txt, cls] = c.modo === "local" ? ["Modo local · solo esta computadora", "text-warn"] : c.caido || c.realtime === "desconectado" ? ["Sin conexión", "text-crit"] : c.realtime === "conectado" ? ["Conectado", "text-ok"] : ["Conectando…", "text-muted"];
  return <span className={`flex items-center gap-1.5 text-xs font-semibold ${cls}`} data-conexion={c.realtime}><span className="dot-estado" />{txt}</span>;
}

function Fila({ cfg, valor, estado, onCambio }) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState("");
  const E = ESTADO[estado] || ESTADO.normal;
  const dec = cfg.dec || 0;
  const num = Number(valor);
  const fmt = Number.isFinite(num) ? num.toLocaleString("es-MX", { minimumFractionDigits: dec, maximumFractionDigits: dec }) : "—";
  const fijar = (x) => {
    if (!Number.isFinite(x)) return;
    const r = Math.round(Math.min(cfg.max, Math.max(cfg.min, x)) * 10 ** dec) / 10 ** dec;
    onCambio(cfg.c, r);
  };
  const confirmar = () => {
    setEditando(false);
    const x = Number(String(texto).replace(",", "."));
    if (texto !== "" && Number.isFinite(x)) fijar(x);
  };
  return (
    <div className="flex items-center gap-2 py-2.5" data-fila={cfg.c}>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] text-[#d6c9c9]">{cfg.n}</div>
        {editando ? (
          <input autoFocus type="number" inputMode="decimal" step={cfg.paso} min={cfg.min} max={cfg.max} value={texto} aria-label={cfg.n}
            onChange={(e) => setTexto(e.target.value)} onBlur={confirmar} onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            className="campo mt-0.5 w-32 font-display text-2xl font-semibold" />
        ) : (
          <button onClick={() => { setTexto(Number.isFinite(num) ? String(num) : ""); setEditando(true); }} aria-label={`${cfg.n}: ${fmt} ${cfg.u}. Tocar para escribir`}
            className={`font-display text-[28px] font-semibold leading-tight tracking-[-0.5px] ${estado === "normal" ? "text-fg" : E.color}`}>
            {fmt}<span className="ml-1 text-xs font-normal text-muted">{cfg.u}</span>
          </button>
        )}
      </div>
      <button onClick={() => fijar((Number.isFinite(num) ? num : cfg.min) - cfg.paso)} aria-label={`Bajar ${cfg.n}`} data-accion="menos"
        className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/15 bg-white/[0.07] text-2xl font-semibold text-fg active:scale-95 active:bg-white/15">−</button>
      <button onClick={() => fijar((Number.isFinite(num) ? num : cfg.min) + cfg.paso)} aria-label={`Subir ${cfg.n}`} data-accion="mas"
        className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/15 bg-white/[0.07] text-2xl font-semibold text-fg active:scale-95 active:bg-white/15">+</button>
    </div>
  );
}

function Interruptor({ etiqueta, activo, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} role="switch" aria-checked={!!activo}
      className={`flex min-h-12 items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition disabled:opacity-40 ${activo ? "border-accent/70 bg-accent/15 text-fg" : "border-white/12 bg-white/[0.05] text-soft"}`}>
      <span>{etiqueta}</span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${activo ? "bg-accent" : "bg-white/20"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${activo ? "left-[22px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

export default function Control() {
  const [aid, setAid] = useAstronautId();
  const { data, analisis, loading, error } = useQuickFix(aid);
  const [pendientes, setPendientes] = useState({});
  const [aviso, setAviso] = useState(null);
  const [ficha, setFicha] = useState(null);
  const timers = useRef({});
  const idsTrip = (data?.astronauts || []).map((a) => a.id);
  const fichas = useFichas(data?.astronaut?.id ?? aid);

  useEffect(() => {
    setPendientes({});
    const t = timers.current;
    return () => Object.values(t).forEach(clearTimeout);
  }, [aid]);

  const avisar = useCallback((txt) => {
    setAviso(txt);
    setTimeout(() => setAviso(null), 2600);
  }, []);

  const guardar = useCallback((clave, valor) => {
    setPendientes((p) => ({ ...p, [clave]: valor }));
    clearTimeout(timers.current[clave]);
    timers.current[clave] = setTimeout(async () => {
      try {
        if (CLAVES_TRIPULACION.includes(clave)) await setEnVivoTripulacion(idsTrip, { [clave]: valor });
        else await setEnVivo(aid, clave, valor);
      } catch (e) {
        avisar(`No se pudo guardar: ${e?.message || e}`);
      }
      setTimeout(() => setPendientes((p) => {
        if (p[clave] !== valor) return p;
        const r = { ...p };
        delete r[clave];
        return r;
      }), 1500);
    }, DEBOUNCE_MS);
  }, [aid, avisar, idsTrip.join(",")]);

  if (error) return <div className="p-8 text-crit">No se pudieron cargar los datos: {error}</div>;
  if (loading || !analisis) return <div className="grid min-h-screen place-items-center text-muted">Conectando…</div>;

  const { astronauts } = data;
  const base = valoresActuales(data, analisis);
  const val = (k) => (k in pendientes ? pendientes[k] : base[k]);
  const porK = Object.fromEntries(analisis.tarjetas.map((t) => [t.k, t]));
  const r = analisis.radiacion;
  const enEjercicio = data.actividad?.estado === "ejercicio";

  const ejecutar = async (fn, txt) => {
    try {
      await fn();
      avisar(txt);
    } catch (e) {
      avisar(`No se pudo aplicar: ${e?.message || e}`);
    }
  };
  const escenario = (nombre) => {
    const ahora = new Date().toISOString();
    const normal = {
      fc: 66, vfc: 66, sistolica: 115, diastolica: 74, frec_resp: 14, spo2: 98, temperatura: 36.7, horas_sueno: 7.5, reaccion: 290,
      who5: 72, animo: 4, estres: 2, fatiga: 2, tripulacion: 4, co2_ppm: 2600, ejercicio_pct: 100, tasa_radiacion: Math.round(r.tasaBase || 20),
      confusion: false, mareo_de_pie: false, vision_borrosa: false, dolor_cabeza: false, sintomas: [], fiebre: false, actividad: { estado: "reposo", desde: ahora },
    };
    const mapa = {
      Normal: async () => {
        await resetEnVivo(aid);
        await setEnVivoVarios(aid, normal);
        await borrarEnVivo(idsTrip, CLAVES_TRIPULACION);
        await terminarTormenta();
      },
      Esfuerzo: () => setActividad(aid, "ejercicio"),
      Fiebre: () => setEnVivoVarios(aid, { fiebre: true }),
      Fatiga: () => setEnVivoVarios(aid, { horas_sueno: 4.8, reaccion: 385, vfc: 46, fatiga: 4, estres: 4 }),
      "Oxígeno bajo": () => setEnVivoVarios(aid, { spo2: 89, frec_resp: 23 }),
      "Presión baja": () => setEnVivoVarios(aid, { sistolica: 88, diastolica: 56, mareo_de_pie: true }),
      "Tormenta solar": () => iniciarTormenta("S3"),
      "CO₂ alto": async () => {
        await setEnVivoTripulacion(idsTrip, { co2_ppm: 4300 });
        await setEnVivoVarios(aid, { dolor_cabeza: true });
      },
    };
    setPendientes({});
    ejecutar(mapa[nombre], `Escenario: ${nombre}`);
  };
  const alternarSintoma = (s) => {
    const actual = val("sintomas");
    guardar("sintomas", actual.includes(s) ? actual.filter((x) => x !== s) : [...actual, s]);
  };

  return (
    <div className="mx-auto min-h-screen max-w-[540px] px-4 pb-16 pt-4">
      <header className="glass sticky top-3 z-30 flex items-center gap-3 px-4 py-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-[#ffc09980] bg-[linear-gradient(145deg,#ff9c64,#a64d32)]">
          <img src="/logo-quickfix-icono.png" alt="" width={32} height={32} className="h-8 w-8 object-contain" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-display text-lg font-bold leading-tight">Quick<span className="text-accent">Fix</span></div>
          <div className="text-xs text-muted">Control en vivo</div>
        </div>
        <Indicador />
      </header>

      <section className="mt-5" aria-label="Astronauta">
        <h2 className="etiqueta mb-2 px-1">Astronauta</h2>
        <div className="grid grid-cols-3 gap-2">
          {astronauts.map((a) => (
            <button key={a.id} onClick={() => setAid(a.id)} aria-pressed={a.id === aid}
              className={`glass flex min-h-[84px] flex-col items-center justify-center gap-1 p-2 text-center ${a.id === aid ? "border-accent/80 shadow-[0_0_0_1px_rgba(255,151,93,0.7),0_0_24px_rgba(255,151,93,0.25)]" : ""}`}>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[linear-gradient(135deg,#ffb477,#8b4734)] text-xs font-bold text-white">{iniciales(a.nombre)}</span>
              <span className="text-xs font-semibold">{a.nombre.split(" ").at(-1)}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-5" aria-label="Fichas abiertas">
        <h2 className="etiqueta mb-2 px-1">Fichas abiertas</h2>
        <FichasAbiertas fichas={fichas} onAbrir={setFicha} />
      </section>

      <section className="mt-5" aria-label="Escenarios rápidos">
        <h2 className="etiqueta mb-2 px-1">Escenarios rápidos</h2>
        <div className="grid grid-cols-2 gap-2">
          {ESCENARIOS.map((e) => (
            <button key={e} onClick={() => escenario(e)} data-escenario={e}
              className="min-h-12 rounded-2xl border border-[#a8fff055] bg-[#a8fff012] px-3 py-3 text-sm font-semibold text-[#c9f7ed] active:scale-[0.98] active:bg-[#a8fff030]">
              {e}
            </button>
          ))}
        </div>
      </section>

      {GRUPOS.map(([titulo, filas]) => (
        <section key={titulo} className="glass mt-5 px-4 py-2" aria-label={titulo}>
          <h2 className="etiqueta pt-2">{titulo}</h2>
          <div className="divide-y divide-white/10">
            {filas.map((f) => <Fila key={f.c} cfg={f} valor={val(f.c)} estado={porK[f.v]?.estado || "normal"} onCambio={guardar} />)}
          </div>
        </section>
      ))}

      <section className="mt-5" aria-label="Interruptores">
        <h2 className="etiqueta mb-2 px-1">Síntomas y eventos</h2>
        <div className="grid gap-2">
          <Interruptor etiqueta="Confusión" activo={val("confusion")} onClick={() => guardar("confusion", !val("confusion"))} />
          <Interruptor etiqueta="Mareo" activo={val("mareo_de_pie")} onClick={() => guardar("mareo_de_pie", !val("mareo_de_pie"))} />
          <Interruptor etiqueta="Visión borrosa" activo={val("vision_borrosa")} onClick={() => guardar("vision_borrosa", !val("vision_borrosa"))} />
          <Interruptor etiqueta="Dolor de cabeza" activo={val("dolor_cabeza")} onClick={() => guardar("dolor_cabeza", !val("dolor_cabeza"))} />
          <div className="rounded-2xl border border-white/12 bg-white/[0.05] p-3">
            <div className="mb-2 text-sm font-medium text-soft">Síntomas</div>
            <div className="grid grid-cols-2 gap-2">
              {SINTOMAS.map((s) => {
                const on = val("sintomas").includes(s);
                return (
                  <button key={s} onClick={() => alternarSintoma(s)} aria-pressed={on}
                    className={`min-h-11 rounded-xl border px-3 text-sm font-medium capitalize ${on ? "border-warn/70 bg-warn/15 text-warn" : "border-white/12 text-soft"}`}>
                    {NOMBRE_SINTOMA[s] || s}
                  </button>
                );
              })}
            </div>
          </div>
          <Interruptor etiqueta="Ejercicio en curso" activo={enEjercicio} onClick={() => ejecutar(() => setActividad(aid, enEjercicio ? "recuperacion" : "ejercicio"), enEjercicio ? "Ejercicio terminado" : "Ejercicio iniciado")} />
          <Interruptor etiqueta="Tormenta solar activa" activo={!!r.activo} onClick={() => ejecutar(() => (r.activo ? terminarTormenta() : iniciarTormenta("S3")), r.activo ? "Tormenta terminada" : "Tormenta solar S3")} />
          <Interruptor etiqueta="Ya en refugio" activo={!!r.refugio} disabled={!r.activo || r.refugio} onClick={() => ejecutar(() => confirmarRefugio(aid), "Refugio confirmado")} />
          <Interruptor etiqueta="Pulso irregular" activo={val("pulso_irregular")} onClick={() => guardar("pulso_irregular", !val("pulso_irregular"))} />
          <Interruptor etiqueta="Tarea crítica (caminata o maniobra)" activo={val("tarea_critica")} onClick={() => guardar("tarea_critica", !val("tarea_critica"))} />
          <Interruptor etiqueta="Alarma de la nave · toda la tripulación" activo={!!val("alarma_nave")} onClick={() => guardar("alarma_nave", val("alarma_nave") ? null : { tipo: "incendio", desde: new Date().toISOString() })} />
          <div className="rounded-2xl border border-white/12 bg-white/[0.05] p-3">
            <div className="mb-2 text-sm font-medium text-soft">Fase de la misión · toda la tripulación</div>
            <div className="grid grid-cols-4 gap-2">
              {FASES.map(([k, n]) => (
                <button key={k} onClick={() => guardar("fase_mision", k)} aria-pressed={val("fase_mision") === k}
                  className={`min-h-11 rounded-xl border px-2 text-sm font-medium ${val("fase_mision") === k ? "border-accent/70 bg-accent/15 text-fg" : "border-white/12 text-soft"}`}>{n}</button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <button onClick={() => { setPendientes({}); ejecutar(async () => { await resetEnVivo(aid); await borrarEnVivo(idsTrip, CLAVES_TRIPULACION); await terminarTormenta(); }, "Cambios en vivo borrados"); }}
        className="mt-6 min-h-12 w-full rounded-2xl border border-crit/60 bg-crit/10 px-4 py-3 font-semibold text-crit active:scale-[0.99]" data-accion="restablecer">
        Restablecer
      </button>

      <VigiaFichas astronautId={data.astronaut.id} ejecutar={false} fichas={fichas} onAbrir={setFicha} />
      {ficha && <Ficha clave={ficha} astronautId={data.astronaut.id} data={data} analisis={analisis} onClose={() => setFicha(null)} onAbrir={setFicha} quien="control" />}

      {aviso && (
        <div role="status" className="glass aviso-entra fixed bottom-4 left-1/2 z-40 w-[calc(100%-2rem)] max-w-[480px] -translate-x-1/2 rounded-full px-4 py-2.5 text-center text-sm font-semibold">
          {aviso}
        </div>
      )}
    </div>
  );
}
