"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EncabezadoPagina, Shell, Toast, ESTADO, ESTADO_GENERAL } from "@/components/Shell";
import { Icon } from "@/components/Icons";
import CyberButton from "@/components/CyberButton";
import { EstadoPill, Fuente, fmtNum } from "@/components/Widgets";
import { TrendChart } from "@/components/Charts";
import { useAstronautId, useQuickFix } from "@/lib/useQuickFix";
import { analizarDia, diaMision, fechaLocal, NOMBRE_SINTOMA, PRUEBAS, SISTEMAS, UMBRALES } from "@/lib/analysis";
import { mensajeMedic } from "@/lib/medic";
import { saveHistoria } from "@/lib/data";
import Estadisticas from "@/components/historial/Estadisticas";

const DIAS_SEM = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const SECCIONES = [
  { k: "heredofamiliares", t: "Antecedentes heredofamiliares", campos: [["diabetes", "Diabetes"], ["hipertension", "Hipertensión"], ["cardiopatia", "Cardiopatías"], ["cancer", "Cáncer"], ["otros", "Otros"]] },
  {
    k: "personales_patologicos", t: "Antecedentes personales patológicos",
    campos: [["asma", "Asma"], ["alergias", "Alergias"], ["cirugias", "Cirugías"], ["fracturas", "Fracturas"], ["cronicas", "Enfermedades crónicas"], ["hospitalizaciones", "Hospitalizaciones"], ["tabaco", "Tabaquismo"], ["alcohol", "Alcohol"]],
  },
  { k: "no_patologicos", t: "Antecedentes personales no patológicos", campos: [["actividad_fisica", "Actividad física"], ["alimentacion", "Alimentación"], ["sueno", "Sueño"], ["vacunas", "Vacunas"]] },
  { k: "padecimiento_actual", t: "Padecimiento actual", texto: true },
  {
    k: "interrogatorio_sistemas", t: "Interrogatorio por aparatos y sistemas",
    campos: [["respiratorio", "Respiratorio"], ["cardiovascular", "Cardiovascular"], ["digestivo", "Digestivo"], ["neurologico", "Neurológico"], ["vision", "Visión"], ["musculo_esqueletico", "Músculo-esquelético"], ["piel", "Piel"], ["animo", "Ánimo"]],
  },
  { k: "espacial", t: "Antecedentes espaciales", campos: [["mareo_espacial_previo", "Mareo espacial previo"], ["sans_previo", "SANS previo"]] },
];

const keyMes = (y, m) => `${y}-${String(m + 1).padStart(2, "0")}`;
const fmtFecha = (f) => new Date(f + "T12:00:00").toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });

function HistoriaClinica({ astronautId, historia, onToast }) {
  const [h, setH] = useState(historia);
  const [abiertas, setAbiertas] = useState({ heredofamiliares: true });
  const [sucio, setSucio] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const firma = JSON.stringify(historia);
  useEffect(() => {
    if (!sucio) setH(JSON.parse(firma));
  }, [firma, sucio]);
  useEffect(() => setSucio(false), [astronautId]);
  const set = (sec, campo, v) => {
    setSucio(true);
    setH((x) => (campo ? { ...x, [sec]: { ...(x[sec] || {}), [campo]: v } } : { ...x, [sec]: v }));
  };
  async function guardar() {
    setGuardando(true);
    try {
      await saveHistoria(astronautId, h);
      setSucio(false);
      onToast("Historia clínica guardada.");
    } catch (e) {
      onToast("No se pudo guardar: " + (e.message || e));
    } finally {
      setGuardando(false);
    }
  }
  return (
    <section className="card p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Historia clínica</h2>
          <Fuente extra="NOM-004-SSA3-2012, del expediente clínico" />
        </div>
        <div className="flex items-center gap-3">
          {sucio && <span className="text-sm text-warn">Cambios sin guardar</span>}
          <CyberButton onClick={guardar} disabled={!sucio || guardando} atajo="↵" texto={guardando ? "Guardando…" : "Guardar historia clínica"}>
            {guardando ? "Guardando…" : "Guardar historia clínica"}
          </CyberButton>
        </div>
      </div>
      <div className="space-y-2">
        {SECCIONES.map((s) => {
          const abierta = !!abiertas[s.k];
          return (
            <div key={s.k} className="rounded-xl border border-line">
              <button onClick={() => setAbiertas((a) => ({ ...a, [s.k]: !a[s.k] }))} aria-expanded={abierta}
                className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left font-medium hover:bg-ink/5">
                <span className="flex items-center gap-2">{s.k === "espacial" && <Icon name="rad" size={16} className="text-violet" />}{s.t}</span>
                <span className={`text-muted transition ${abierta ? "rotate-90" : ""}`}><Icon name="chev" size={16} /></span>
              </button>
              {abierta && (
                <div className="grid gap-3 border-t border-line p-4 md:grid-cols-2">
                  {s.texto ? (
                    <label className="block text-sm md:col-span-2">
                      <span className="mb-1 block text-xs text-muted">Descripción</span>
                      <textarea rows={3} value={h[s.k] || ""} onChange={(e) => set(s.k, null, e.target.value)} className="campo" />
                    </label>
                  ) : (
                    s.campos.map(([c, t]) => (
                      <label key={c} className="block text-sm">
                        <span className="mb-1 block text-xs text-muted">{t}</span>
                        <input value={h[s.k]?.[c] || ""} onChange={(e) => set(s.k, c, e.target.value)} className="campo" />
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function Historial() {
  const [aid, setAid] = useAstronautId();
  const { data, analisis, loading, error } = useQuickFix(aid);
  const [mes, setMes] = useState(null);
  const [diaSel, setDiaSel] = useState(null);
  const [toast, setToast] = useState(null);
  const closeToast = useCallback(() => setToast(null), []);

  const porDia = useMemo(() => {
    if (!data) return null;
    const m = new Map();
    for (const v of data.vitals) m.set(v.fecha, analizarDia(data, v.fecha));
    return m;
  }, [data]);

  useEffect(() => {
    setDiaSel(null);
  }, [aid]);

  if (error) return <div className="p-10 text-crit">No se pudieron cargar los datos: {error}</div>;
  if (loading || !analisis || !porDia) return <div className="flex min-h-screen items-center justify-center text-muted">Cargando historial…</div>;

  const { astronaut, astronauts, vitals, checkins, pruebas, protocols, profile } = data;
  const fechas = vitals.map((v) => v.fecha);
  const ultima = fechas[fechas.length - 1];
  const [uy, um] = ultima.split("-").map(Number);
  const [py, pm] = fechas[0].split("-").map(Number);
  const actual = mes || { y: uy, m: um - 1 };
  const primero = new Date(actual.y, actual.m, 1);
  const enMes = new Date(actual.y, actual.m + 1, 0).getDate();
  const offset = (primero.getDay() + 6) % 7;
  const celdas = [...Array(offset).fill(null), ...Array.from({ length: enMes }, (_, i) => keyMes(actual.y, actual.m) + "-" + String(i + 1).padStart(2, "0"))];
  const puedeAtras = actual.y > py || (actual.y === py && actual.m > pm - 1);
  const puedeAdelante = actual.y < uy || (actual.y === uy && actual.m < um - 1);
  const mover = (d) => {
    const n = new Date(actual.y, actual.m + d, 1);
    setMes({ y: n.getFullYear(), m: n.getMonth() });
  };

  const delMes = fechas.filter((f) => f.startsWith(keyMes(actual.y, actual.m))).map((f) => [f, porDia.get(f)]);
  const conBase = delMes.filter(([, a]) => a?.suficiente);
  const verdes = conBase.filter(([, a]) => a.general === "normal").length;
  let nuevas = 0;
  for (const [f, a] of conBase) {
    const i = fechas.indexOf(f);
    const prev = i > 0 ? porDia.get(fechas[i - 1]) : null;
    const antes = new Set((prev?.suficiente ? prev.activas : []).map((x) => x.clave));
    nuevas += a.activas.filter((x) => !antes.has(x.clave)).length;
  }
  const promIndice = conBase.length ? conBase.reduce((s, [, a]) => s + a.preparacion.total, 0) / conBase.length : null;

  const sel = diaSel && porDia.get(diaSel) ? diaSel : ultima;
  const an = porDia.get(sel);
  const v = vitals.find((x) => x.fecha === sel);
  const ci = checkins.find((x) => x.fecha === sel);
  const prDia = pruebas.filter((p) => p.fecha === sel);
  const med = an?.suficiente ? mensajeMedic(an, astronaut, { protocols, alergias: profile?.alergias }) : null;

  const lab = (f) => `D${diaMision(astronaut, f)}`;
  const tend = vitals.map((x) => ({ dia: lab(x.fecha), fc: x.fc, sueno: Number(x.horas_sueno), ej: x.minutos_ejercicio }));
  const sem = DIAS_SEM.map((d, i) => {
    const filas = vitals.filter((x) => (new Date(x.fecha + "T12:00:00").getDay() + 6) % 7 === i);
    const prom = (k) => (filas.length ? filas.reduce((s, x) => s + Number(x[k]), 0) / filas.length : null);
    return { dia: d, sueno: Math.round(prom("horas_sueno") * 10) / 10, ej: Math.round(prom("minutos_ejercicio")) };
  });
  const colorCelda = (a) => (!a ? null : !a.suficiente ? "sin" : a.general);
  const fd = fechaLocal;
  const eventoDe = (f) => (data.eventos || []).find((e) => fd(e.inicio) <= f && (!e.fin || fd(e.fin) >= f));
  const dosisDe = (f) => Number(vitals.find((x) => x.fecha === f)?.dosis_dia_msv) || 0;

  return (
    <Shell active="/historial" astronaut={astronaut} astronauts={astronauts} onAstronaut={setAid} astronautId={aid} analisis={analisis} pie="Medic no diagnostica; lo grave se escala al médico de tripulación.">
      <EncabezadoPagina titulo="Historial" sub={`${vitals.length} días de misión · por categoría, prueba e historia clínica`} />

      <Estadisticas data={data} porDia={porDia} aid={aid} astronauts={astronauts} onAstronaut={setAid}>
      <>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="card p-5">
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-line p-3">
              <div className="text-xs text-muted">Días en verde</div>
              <div className="text-2xl font-semibold text-ok">{verdes} <span className="text-sm font-normal text-muted">de {conBase.length}</span></div>
            </div>
            <div className="rounded-xl border border-line p-3">
              <div className="text-xs text-muted">Alertas nuevas del mes</div>
              <div className="text-2xl font-semibold">{nuevas}</div>
            </div>
            <div className="rounded-xl border border-line p-3">
              <div className="text-xs text-muted">Índice de preparación promedio</div>
              <div className="text-2xl font-semibold">{promIndice != null ? fmtNum(promIndice) : "—"} <span className="text-sm font-normal text-muted">/ 100</span></div>
            </div>
          </div>

          <div className="mb-3 flex items-center justify-between">
            <button onClick={() => mover(-1)} disabled={!puedeAtras} aria-label="Mes anterior" className="rounded-lg border border-line p-2 hover:bg-ink/5 disabled:opacity-30"><Icon name="back" size={18} /></button>
            <h2 className="text-lg font-semibold capitalize">{MESES[actual.m]} {actual.y}</h2>
            <button onClick={() => mover(1)} disabled={!puedeAdelante} aria-label="Mes siguiente" className="rounded-lg border border-line p-2 hover:bg-ink/5 disabled:opacity-30"><Icon name="chev" size={18} /></button>
          </div>
          <div className="grid grid-cols-7 gap-1.5 text-center text-xs text-muted">
            {DIAS_SEM.map((d) => <div key={d} className="py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1.5" role="grid" aria-label={`Calendario de ${MESES[actual.m]}`}>
            {celdas.map((f, i) => {
              if (!f) return <div key={`v${i}`} />;
              const a = porDia.get(f);
              const e = colorCelda(a);
              const d = Number(f.slice(-2));
              const activo = f === sel;
              return (
                <button key={f} disabled={!a} onClick={() => setDiaSel(f)} aria-pressed={activo} aria-label={`${fmtFecha(f)}${e ? `: ${e === "sin" ? "sin línea base" : ESTADO_GENERAL[e]}` : ": sin datos"}`}
                  className={`relative flex aspect-square flex-col items-center justify-center rounded-xl border text-sm transition sm:aspect-[1.3] ${
                    activo ? "border-accent ring-2 ring-accent/60" : "border-line"
                  } ${a ? "hover:brightness-110" : "opacity-35"}`}
                  style={e ? { background: `color-mix(in oklab, ${ESTADO[e].hex} ${e === "sin" ? 10 : 22}%, transparent)` } : undefined}>
                  <span className={`font-semibold ${f === ultima ? "text-accent" : ""}`}>{d}</span>
                  {eventoDe(f) ? (
                    <span className="mt-0.5 text-[10px] font-semibold leading-none text-crit" title={`Evento de radiación ${eventoDe(f).nivel}`}>☢ {dosisDe(f).toFixed(1)}</span>
                  ) : e && e !== "sin" && <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${ESTADO[e].bg}`} />}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
            {["normal", "atencion", "critico"].map((e) => <span key={e} className="flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-full ${ESTADO[e].bg}`} /> {ESTADO_GENERAL[e]}</span>)}
            <span className="flex items-center gap-1.5 text-crit">☢ Evento de radiación (dosis del día en mSv)</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-muted/40" /> Sin línea base aún</span>
          </div>
        </section>

        <section className="card p-5" aria-live="polite">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs text-muted">Día {diaMision(astronaut, sel)} de misión</div>
              <h2 className="text-lg font-semibold first-letter:uppercase">{fmtFecha(sel)}</h2>
            </div>
            {an?.suficiente ? <EstadoPill estado={an.general}>{ESTADO_GENERAL[an.general]}</EstadoPill> : <EstadoPill estado="sin">Sin línea base</EstadoPill>}
          </div>
          {v && (
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {[["FC", v.fc, "lpm"], ["VFC", v.vfc, "ms"], ["PA", `${v.sistolica}/${v.diastolica}`, ""], ["SpO₂", v.spo2, "%"], ["FR", v.frec_resp, "rpm"], ["Temp", v.temperatura, "°C"],
                ["Sueño", v.horas_sueno, "h"], ["Ejercicio", v.minutos_ejercicio, "min"], ["Dosis", Number(v.dosis_dia_msv).toFixed(2), "mSv"]].map(([k, x, u]) => (
                <div key={k} className="rounded-lg bg-ink/5 px-2 py-1.5">
                  <div className="text-[11px] text-muted">{k}</div>
                  <div className="text-sm font-semibold">{x} <span className="text-[10px] font-normal text-muted">{u}</span></div>
                </div>
              ))}
            </div>
          )}
          {eventoDe(sel) && (() => {
            const ev = eventoDe(sel);
            const ref = ev.refugio?.[aid];
            return (
              <div className="mt-4 rounded-xl border border-crit/50 bg-crit/10 p-3 text-sm">
                <div className="font-semibold text-crit">☢ Evento de radiación · tormenta solar {ev.nivel} {ev.origen === "noaa" ? "(dato real NOAA)" : ""}</div>
                <div className="text-soft">
                  Dosis del día: {dosisDe(sel).toFixed(2)} mSv{ev.fin ? ` · dosis del evento: ${analisis.radiacion.dosisEvento(ev).toFixed(ev.fin && analisis.radiacion.dosisEvento(ev) < 1 ? 3 : 1)} mSv` : " · evento en curso"}
                  {ref ? ` · refugio confirmado a las ${new Date(ref).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false })}` : " · sin confirmación de refugio"}
                </div>
              </div>
            );
          })()}
          <div className="mt-4">
            <div className="mb-1 text-xs uppercase tracking-widest text-muted">Alertas</div>
            {an?.activas.length ? (
              <ul className="space-y-1">
                {an.activas.map((a) => (
                  <li key={a.id} className="flex items-start gap-2 text-sm"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${ESTADO[a.estado].bg}`} />{a.motivo} <span className="text-muted">· {SISTEMAS[a.sistema]?.nombre}</span></li>
                ))}
              </ul>
            ) : <div className="text-sm text-muted">Sin alertas.</div>}
          </div>
          <div className="mt-4">
            <div className="mb-1 text-xs uppercase tracking-widest text-muted">Check-in</div>
            {ci ? (
              <div className="text-sm">
                Ánimo {ci.animo}/5 · estrés {ci.estres}/5 · fatiga {ci.fatiga}/5{ci.tripulacion ? ` · tripulación ${ci.tripulacion}/5` : ""}{ci.tiempo_reaccion_ms ? ` · reacción ${ci.tiempo_reaccion_ms} ms` : ""}
                {(() => {
                  const f = [ci.confusion && "confusión", ci.mareo_de_pie && "mareo", (ci.vision_borrosa || ci.vision_cefalea) && "visión borrosa", (ci.dolor_cabeza || ci.vision_cefalea) && "dolor de cabeza", ...(ci.sintomas || []).map((x) => NOMBRE_SINTOMA[x] || x)].filter(Boolean);
                  return f.length ? <div className="text-warn">Reportó: {f.join(", ")}</div> : null;
                })()}
                {(() => {
                  const cb = (data.cabina || []).find((x) => x.fecha === sel);
                  return cb ? <div className="text-muted">Cabina: CO₂ {cb.co2_ppm.toLocaleString("es-MX")} ppm · {cb.temp_c} °C · {cb.humedad} % humedad</div> : null;
                })()}
              </div>
            ) : <div className="text-sm text-muted">Sin check-in.</div>}
          </div>
          <div className="mt-4">
            <div className="mb-1 text-xs uppercase tracking-widest text-muted">Pruebas realizadas</div>
            {prDia.length ? (
              <ul className="space-y-1 text-sm">{prDia.map((p, i) => <li key={p.id || i}><span className="font-medium">{PRUEBAS[p.tipo]?.nombre}</span> <span className="text-muted">· {p.interpretacion}</span></li>)}</ul>
            ) : <div className="text-sm text-muted">Ninguna.</div>}
          </div>
          <div className="mt-4 rounded-xl border border-line bg-ink/[0.04] p-3">
            <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-accent"><Icon name="medic" size={18} /> Lo que recomendó Medic</div>
            {med ? (
              <>
                <p className="text-sm">{med.texto}</p>
                {med.acciones?.length > 0 && <ul className="mt-1 list-inside list-disc text-sm text-soft">{med.acciones.map((x, i) => <li key={i}>{x}</li>)}</ul>}
              </>
            ) : <p className="text-sm text-muted">Aún no había suficientes días para tu línea base personal ({UMBRALES.diasMinLineaBase} días).</p>}
          </div>
        </section>
      </div>

      <section className="mt-5 grid gap-5 lg:grid-cols-3">
        <div className="card p-5">
          <h2 className="font-semibold">FC en reposo · 90 días</h2>
          <TrendChart datos={tend} series={[{ key: "fc", nombre: "FC en reposo", color: "pink" }]} unidad="lpm" alto={190} />
        </div>
        <div className="card p-5">
          <h2 className="font-semibold">Sueño · 90 días</h2>
          <TrendChart datos={tend} series={[{ key: "sueno", nombre: "Sueño", color: "violet" }]} banda={[7, 8]} bandaTxt="Meta" unidad="h" dec={1} alto={190} />
        </div>
        <div className="card p-5">
          <h2 className="font-semibold">Ejercicio · 90 días</h2>
          <TrendChart datos={tend} series={[{ key: "ej", nombre: "Ejercicio", color: "violet", tipo: "bar" }]} linea={UMBRALES.ejercicioMinMin} lineaTxt="Meta 90" unidad="min" alto={190} />
        </div>
      </section>

      <section className="card mt-5 p-5">
        <h2 className="font-semibold">Por día de la semana</h2>
        <p className="text-xs text-muted">Promedio de los últimos 90 días</p>
        <div className="mt-2 grid gap-5 md:grid-cols-2">
          <div>
            <div className="text-sm text-soft">Sueño (h)</div>
            <TrendChart datos={sem} series={[{ key: "sueno", nombre: "Sueño", color: "violet", tipo: "bar" }]} unidad="h" dec={1} alto={180} dominio={[0, 9]} />
          </div>
          <div>
            <div className="text-sm text-soft">Ejercicio (min)</div>
            <TrendChart datos={sem} series={[{ key: "ej", nombre: "Ejercicio", color: "violet", tipo: "bar" }]} unidad="min" alto={180} dominio={[0, 160]} />
          </div>
        </div>
      </section>

      <div className="mt-5">
        <HistoriaClinica astronautId={aid} historia={data.historia} onToast={setToast} />
      </div>
      </>
      </Estadisticas>
      <Toast msg={toast} onClose={closeToast} />
    </Shell>
  );
}
